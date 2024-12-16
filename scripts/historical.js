import { initSupabase } from './supabase.js';

// Initialize Supabase
let supabase;
(async () => {
    supabase = await initSupabase();
})();

// Load API keys for Vercel or local environment
async function loadApiKey() {
    try {
        if (typeof process !== 'undefined' && process.env.OPENWEATHER_API_KEY) {
            // Vercel environment
            return process.env.OPENWEATHER_API_KEY;
        } else {
            // Local environment
            const res = await fetch('/aerolife/config.json');
            if (!res.ok) throw new Error('Failed to load config.json');
            const config = await res.json();
            return config.OPENWEATHER_API_KEY;
        }
    } catch (error) {
        console.error('Error loading API key:', error);
        return null;
    }
}

// Track chart instances to destroy them before rendering new ones
let chartInstances = {};

// Utility function to fetch user's location by IP
async function fetchUserLocation() {
    try {
        const res = await fetch('http://ip-api.com/json/');
        if (!res.ok) throw new Error('Failed to fetch location');
        const data = await res.json();
        return {
            zip: data.zip || '00000',
            lat: data.lat || 0,
            lon: data.lon || 0,
            city: data.city || 'Unknown',
        };
    } catch (error) {
        console.error('Error fetching location:', error);
        return { zip: '00000', lat: 0, lon: 0, city: 'Unknown' };
    }
}

// Fetch coordinates from ZIP code
async function fetchCoordinatesFromZip(zip, apiKey) {
    const url = `https://api.openweathermap.org/geo/1.0/zip?zip=${zip},US&appid=${apiKey}`;
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error('Invalid ZIP code or data unavailable.');
        const data = await res.json();
        return { lat: data.lat, lon: data.lon, city: data.name, zip };
    } catch (error) {
        console.error('Error fetching coordinates from ZIP:', error);
        return null;
    }
}

// Fetch historical AQI data
async function fetchHistoricalAQIData(lat, lon, start, end, apiKey) {
    const url = `https://api.openweathermap.org/data/2.5/air_pollution/history?lat=${lat}&lon=${lon}&start=${start}&end=${end}&appid=${apiKey}`;
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Error: ${response.statusText}`);
        return await response.json();
    } catch (error) {
        console.error('Failed to fetch historical AQI data:', error);
        return null;
    }
}

// Fetch cached data from Supabase
async function fetchCachedHistoricalData(zip, dataType) {
    const oneHourAgo = Date.now() - 3600 * 1000;

    const { data: cachedData, error } = await supabase
        .from('cache')
        .select('*')
        .eq('zipcode', zip)
        .order('timestamp', { ascending: false })
        .limit(1);

    if (error) {
        console.error(`Error fetching cached ${dataType} data for ZIP ${zip}:`, error);
        return null;
    }

    if (cachedData?.length > 0) {
        const cacheTimestamp = new Date(cachedData[0].timestamp).getTime();
        if (cacheTimestamp > oneHourAgo) {
            console.log(`Using cached ${dataType} data for ZIP ${zip}.`);
            return cachedData[0][`${dataType}_data`];
        }
    }

    return null;
}

// Update or insert cached data in Supabase
async function cacheHistoricalData(city, zip, latitude, longitude, dataType, data) {
    const { error } = await supabase
        .from('cache')
        .upsert(
            {
                city,
                zipcode: zip, // Correct column name with unique constraint
                latitude,
                longitude,
                [`${dataType}_data`]: data,
                timestamp: new Date().toISOString(),
            },
            { onConflict: 'zipcode' } // Use 'zipcode' for conflict resolution
        );

    if (error) {
        console.error(`Error caching ${dataType} data for ZIP ${zip}:`, error);
    } else {
        console.log(`Cache updated for ZIP ${zip} (${dataType}).`);
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

    if (chartInstances[chartId]) {
        chartInstances[chartId].destroy();
    }

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
                x: { title: { display: true, text: 'Time' } },
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

// Fetch and display historical data
async function fetchAndDisplayHistoricalData(lat, lon, zip, city, start, end, dataType, chartId, apiKey) {
    const cachedData = await fetchCachedHistoricalData(zip, dataType);
    if (cachedData) {
        const preparedData = prepareChartData(cachedData);
        renderChart(chartId, preparedData);
        return;
    }

    const historicalData = await fetchHistoricalAQIData(lat, lon, start, end, apiKey);
    if (historicalData) {
        const preparedData = prepareChartData(historicalData);
        renderChart(chartId, preparedData);
        await cacheHistoricalData(city, zip, lat, lon, dataType, historicalData);
    }
}

// Update graphs for past 24 hours and 1 year
async function updateGraphs(lat, lon, zip, city, apiKey) {
    const now = Math.floor(Date.now() / 1000);
    const oneDayAgo = now - 24 * 3600;
    const oneYearAgo = now - 365 * 24 * 3600;

    await fetchAndDisplayHistoricalData(lat, lon, zip, city, oneDayAgo, now, '24hr', 'dayChart', apiKey);
    await fetchAndDisplayHistoricalData(lat, lon, zip, city, oneYearAgo, now, '1yr', 'rangeChart', apiKey);
}

// Initialize and load
document.addEventListener('DOMContentLoaded', async () => {
    const apiKey = await loadApiKey();
    if (!apiKey) return;

    const initialLocation = await fetchUserLocation();
    if (initialLocation) {
        const { zip, lat, lon, city } = initialLocation;
        document.getElementById('current-location').textContent = `${city}, ${zip}`;
        await updateGraphs(lat, lon, zip, city, apiKey);
    }

    document.getElementById('change-zip-btn').addEventListener('click', async () => {
        const zip = document.getElementById('manual-zip').value.trim();
        if (!/^\d{5}$/.test(zip)) {
            alert('Please enter a valid 5-digit ZIP code.');
            return;
        }

        const coords = await fetchCoordinatesFromZip(zip, apiKey);
        if (coords) {
            const { lat, lon, city } = coords;
            document.getElementById('current-location').textContent = `${city}, ${zip}`;
            await updateGraphs(lat, lon, zip, city, apiKey);
        }
    });
});