import { initSupabase } from './supabase.js';

// Initialize Supabase
let supabase;

(async () => {
    supabase = await initSupabase();
})();

document.addEventListener('DOMContentLoaded', async () => {
    // Fetch API Key from config.json
    let OPENWEATHER_API_KEY = '';
    try {
        const res = await fetch('config.json'); // Adjust path if needed
        if (!res.ok) throw new Error('Failed to load API key file');
        const config = await res.json();
        OPENWEATHER_API_KEY = config.OPENWEATHER_API_KEY;
        if (!OPENWEATHER_API_KEY) throw new Error('API key not found in configuration file');
    } catch (error) {
        console.error('Error loading API key:', error);
        return;
    }

    let currentLat = null;
    let currentLon = null;
    let currentCity = null;

    // Track chart instances to destroy them before rendering new ones
    let chartInstances = {};

    // Fetch user's location by IP
    async function fetchUserLocation() {
        try {
            const res = await fetch('http://ip-api.com/json/');
            if (!res.ok) throw new Error('Failed to fetch location');
            const data = await res.json();
            return {
                lat: data.lat || 0,
                lon: data.lon || 0,
                city: data.city || 'Unknown',
            };
        } catch (error) {
            console.error('Error fetching location:', error);
            return { lat: 0, lon: 0, city: 'Unknown' };
        }
    }

    // Fetch coordinates from ZIP code
    async function fetchCoordinatesFromZip(zip) {
        const url = `https://api.openweathermap.org/geo/1.0/zip?zip=${zip},US&appid=${OPENWEATHER_API_KEY}`;
        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error("Invalid ZIP code or data unavailable.");
            const data = await res.json();
            return { lat: data.lat, lon: data.lon, city: data.name };
        } catch (error) {
            console.error("Error fetching coordinates from ZIP:", error);
            return null;
        }
    }

    // Utility function to convert date to Unix timestamp
    function convertDateToUnix(dateString) {
        const date = new Date(dateString);
        return Math.floor(date.getTime() / 1000);
    }

    // Fetch historical AQI data
    async function fetchHistoricalAQIData(lat, lon, start, end) {
        const url = `https://api.openweathermap.org/data/2.5/air_pollution/history?lat=${lat}&lon=${lon}&start=${start}&end=${end}&appid=${OPENWEATHER_API_KEY}`;
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Error: ${response.statusText}`);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Failed to fetch historical AQI data:', error);
            return null;
        }
    }

    // Prepare data for Chart.js
    function prepareChartData(aqiData) {
        const labels = [];
        const aqiValues = [];

        aqiData.list.forEach((entry) => {
            const date = new Date(entry.dt * 1000);
            labels.push(date.toLocaleString());
            aqiValues.push(entry.main.aqi);
        });

        return { labels, aqiValues };
    }

    // Render chart using Chart.js
    function renderChart(chartId, chartData) {
        const ctx = document.getElementById(chartId).getContext('2d');

        // Destroy the existing chart if it exists
        if (chartInstances[chartId]) {
            chartInstances[chartId].destroy();
        }

        // Create and store the new chart instance
        chartInstances[chartId] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: chartData.labels,
                datasets: [
                    {
                        label: 'Air Quality Index',
                        data: chartData.aqiValues,
                        borderColor: 'rgba(75, 192, 192, 1)',
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        fill: true,
                    },
                ],
            },
            options: {
                responsive: true,
                scales: {
                    x: {
                        title: { display: true, text: 'Time' },
                    },
                    y: {
                        title: { display: true, text: 'AQI (1 - Good to 5 - Poor)' },
                        min: 1,
                        max: 5,
                        ticks: { stepSize: 1 },
                    },
                },
            },
        });
    }

    // Fetch cached data from Supabase
    async function fetchCachedHistoricalData(city, dataType) {
        const oneHourAgo = Date.now() - 3600 * 1000;

        const { data: cachedData, error } = await supabase
            .from('cache')
            .select('*')
            .eq('city', city)
            .order('timestamp', { ascending: false })
            .limit(1);

        if (error) {
            console.error(`Error fetching cached ${dataType} data for ${city}:`, error);
            return null;
        }

        if (cachedData && cachedData.length > 0) {
            const cacheTimestamp = new Date(cachedData[0].timestamp).getTime();
            if (cacheTimestamp > oneHourAgo) {
                console.log(`Using cached ${dataType} data for ${city}.`);
                return cachedData[0][`${dataType}_data`];
            }
        }

        return null;
    }

    // Update or insert cached data in Supabase
    async function cacheHistoricalData(city, latitude, longitude, dataType, data) {
        const { error } = await supabase
            .from('cache')
            .upsert(
                {
                    city,
                    latitude,
                    longitude,
                    [`${dataType}_data`]: data,
                    timestamp: new Date().toISOString(),
                },
                { onConflict: 'city' }
            );

        if (error) {
            console.error(`Error caching ${dataType} data for ${city}:`, error);
        } else {
            console.log(`Cache updated for ${city} (${dataType}).`);
        }
    }

    // Fetch and display historical data
    async function fetchAndDisplayHistoricalData(lat, lon, city, start, end, dataType, chartId) {
        const cachedData = await fetchCachedHistoricalData(city, dataType);
        if (cachedData) {
            console.log(`Displaying cached ${dataType} data:`, cachedData);
            const preparedData = prepareChartData(cachedData);
            renderChart(chartId, preparedData);
            return;
        }

        const historicalData = await fetchHistoricalAQIData(lat, lon, start, end);
        if (historicalData) {
            console.log(`Displaying fresh ${dataType} data:`, historicalData);
            const preparedData = prepareChartData(historicalData);
            renderChart(chartId, preparedData);
            await cacheHistoricalData(city, lat, lon, dataType, historicalData);
        }
    }

    // Update graphs for the past 24 hours and the past year
    async function updateGraphs(lat, lon, city) {
        const now = Math.floor(Date.now() / 1000);
        const oneDayAgo = now - 24 * 60 * 60;
        const oneYearAgo = now - 365 * 24 * 60 * 60;

        // Update Past 24 Hours Graph
        await fetchAndDisplayHistoricalData(lat, lon, city, oneDayAgo, now, '24hr', 'dayChart');

        // Update Past Year Graph
        await fetchAndDisplayHistoricalData(lat, lon, city, oneYearAgo, now, '1yr', 'rangeChart');
    }

    // Handle ZIP code changes
    document.getElementById('change-zip-btn').addEventListener('click', async () => {
        const zip = document.getElementById('manual-zip').value.trim();
        if (!/^\d{5}$/.test(zip)) {
            alert('Please enter a valid 5-digit ZIP code.');
            return;
        }

        const coords = await fetchCoordinatesFromZip(zip);
        if (coords) {
            currentLat = coords.lat;
            currentLon = coords.lon;
            currentCity = coords.city;
            document.getElementById('current-location').textContent = `${currentCity}, ${zip}`;
            await updateGraphs(currentLat, currentLon, currentCity);
        } else {
            alert('Failed to fetch data for the provided ZIP code.');
        }
    });

    // Fetch user's initial location
    const initialLocation = await fetchUserLocation();
    if (initialLocation) {
        currentLat = initialLocation.lat;
        currentLon = initialLocation.lon;
        currentCity = initialLocation.city;
        await updateGraphs(currentLat, currentLon, currentCity);
    }
});
