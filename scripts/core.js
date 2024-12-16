import { initSupabase } from './supabase.js';

// Initialize Supabase
let supabase;
(async () => {
    supabase = await initSupabase();
})();

const ONE_HOUR = 3600 * 1000;

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

// Fetch user's location by IP
async function fetchUserLocationByIP() {
    try {
        const res = await fetch('http://ip-api.com/json/');
        if (!res.ok) throw new Error('Failed to fetch location');
        const data = await res.json();
        return {
            zip: data.zip || '00000',
            city: data.city || 'Unknown',
            lat: data.lat || 0,
            lon: data.lon || 0,
        };
    } catch (error) {
        console.error('Error fetching IP-based location:', error);
        return { zip: '00000', city: 'Unknown', lat: 0, lon: 0 };
    }
}

// Fetch coordinates from ZIP code
async function fetchCoordinates(zip, apiKey) {
    const GEO_API_BASE = 'https://api.openweathermap.org/geo/1.0/zip';
    try {
        const res = await fetch(`${GEO_API_BASE}?zip=${zip},US&appid=${apiKey}`);
        if (!res.ok) throw new Error('Invalid ZIP code');
        const data = await res.json();
        return { city: data.name || 'Unknown City', lat: data.lat || 0, lon: data.lon || 0, zip };
    } catch (error) {
        console.error('Error fetching coordinates:', error);
        return null;
    }
}

// Fetch air pollution data
async function fetchAirPollutionData(lat, lon, apiKey) {
    const AIR_API_BASE = 'https://api.openweathermap.org/data/2.5/air_pollution';
    try {
        const res = await fetch(`${AIR_API_BASE}?lat=${lat}&lon=${lon}&appid=${apiKey}`);
        if (!res.ok) throw new Error('Failed to fetch air pollution data');
        const data = await res.json();

        if (!data.list || data.list.length === 0) {
            throw new Error('No air pollution data available');
        }

        return { aqi: data.list[0].main.aqi, pollutants: data.list[0].components };
    } catch (error) {
        console.error('Error fetching air pollution data:', error);
        return null;
    }
}

// Check cached data in Supabase by ZIP code
async function checkCache(zip) {
    if (!supabase) {
        console.error('Supabase not initialized.');
        return null;
    }

    const oneHourAgo = Date.now() - ONE_HOUR;

    const { data: cachedData, error } = await supabase
        .from('cache')
        .select('*')
        .eq('zipcode', zip) // Using "zipcode" column
        .order('timestamp', { ascending: false })
        .limit(1);

    if (error) {
        console.error(`Error fetching cached data for ZIP ${zip}:`, error);
        return null;
    }

    if (cachedData?.length > 0) {
        const cacheTimestamp = new Date(cachedData[0].timestamp).getTime();
        if (cacheTimestamp > oneHourAgo) {
            console.log(`Using cached data for ZIP ${zip}.`);
            return cachedData[0];
        }
    }

    console.log(`No valid cache found for ZIP ${zip}.`);
    return null;
}

// Update or insert cache in Supabase
async function updateCache(zip, city, latitude, longitude, currentData) {
    if (!supabase) {
        console.error('Supabase not initialized.');
        return;
    }

    const { error } = await supabase
        .from('cache')
        .upsert(
            {
                zipcode: zip, // Use correct column name
                city,
                latitude,
                longitude,
                current_data: currentData,
                timestamp: new Date().toISOString(),
            },
            { onConflict: 'zipcode' }
        );

    if (error) {
        console.error(`Error updating cache for ZIP ${zip}:`, error);
    } else {
        console.log(`Cache updated for ZIP ${zip}.`);
    }
}

// Display air quality data
function displayCurrentData(data) {
    const currentPollutionDisplay = document.getElementById('current-pollution');
    const pollutantChartsContainer = document.getElementById('pollutant-charts');

    if (!data || !data.aqi || !data.pollutants) {
        currentPollutionDisplay.innerHTML = `<p>Data unavailable for the current location.</p>`;
        pollutantChartsContainer.innerHTML = ''; // Clear previous charts
        console.warn('No valid data to display.');
        return;
    }

    const { aqi, pollutants } = data;

    const aqiDescription = ['Good', 'Fair', 'Moderate', 'Poor', 'Very Poor'];
    const aqiColors = ['#54b947', '#b0d136', '#fdae19', '#f04922', '#ee1f25'];

    // Update AQI display
    currentPollutionDisplay.innerHTML = `
        <span style="
            display: inline-block;
            padding: 0.5rem 1rem;
            border-radius: 8px;
            background: ${aqiColors[aqi - 1]};
            color: white;
            font-weight: bold;
        ">
            AQI: ${aqi} (${aqiDescription[aqi - 1]})
        </span>
    `;

    pollutantChartsContainer.innerHTML = ''; // Clear previous charts

    // Display pollutants as charts
    Object.entries(pollutants).forEach(([key, value]) => {
        const containerId = `gauge-${key}`;
        const gaugeContainer = document.createElement('div');
        gaugeContainer.id = containerId;
        gaugeContainer.className = 'gauge-container';

        gaugeContainer.innerHTML = `
            <h3>${key.toUpperCase()}</h3>
            <p>${value.toFixed(2)} μg/m³</p>
        `;

        pollutantChartsContainer.appendChild(gaugeContainer);
        createGauge(containerId, value, key); // Ensure createGauge is correctly defined
    });
}

// Handle ZIP code changes
async function handleZipChange(zip, apiKey) {
    const locationDisplay = document.getElementById('current-location');
    const coordinatesDisplay = document.getElementById('current-coordinates');

    const coords = await fetchCoordinates(zip, apiKey);
    if (!coords) return;

    const { city, lat, lon } = coords;

    locationDisplay.textContent = `${city}, ${zip}`;
    coordinatesDisplay.textContent = `Lat: ${lat.toFixed(4)}, Lon: ${lon.toFixed(4)}`;

    const cachedEntry = await checkCache(zip);
    if (cachedEntry) {
        displayCurrentData(cachedEntry.current_data);
        return;
    }

    const pollutionData = await fetchAirPollutionData(lat, lon, apiKey);
    if (pollutionData) {
        displayCurrentData(pollutionData);
        await updateCache(zip, city, lat, lon, pollutionData);
    }
}

// Initial Load
document.addEventListener('DOMContentLoaded', async () => {
    const locationDisplay = document.getElementById('current-location');
    const coordinatesDisplay = document.getElementById('current-coordinates');

    const apiKey = await loadApiKey();
    if (!apiKey) {
        console.error('API key missing. Cannot proceed.');
        return;
    }

    const locationData = await fetchUserLocationByIP();
    const { zip, city, lat, lon } = locationData;

    locationDisplay.textContent = `${city}, ${zip}`;
    coordinatesDisplay.textContent = `Lat: ${lat.toFixed(4)}, Lon: ${lon.toFixed(4)}`;

    await handleZipChange(zip, apiKey);
});

// ZIP Code Input Listener
document.getElementById('change-zip-btn').addEventListener('click', async () => {
    const manualZipInput = document.getElementById('manual-zip').value.trim();
    const apiKey = await loadApiKey();

    if (/^\d{5}$/.test(manualZipInput)) {
        await handleZipChange(manualZipInput, apiKey);
    } else {
        const zipErrorDialog = document.getElementById('zip-error-dialog');
        zipErrorDialog.textContent = 'Please enter a valid 5-digit ZIP code.';
        zipErrorDialog.classList.add('show');

        setTimeout(() => {
            zipErrorDialog.classList.remove('show');
        }, 7000);

    }
});
