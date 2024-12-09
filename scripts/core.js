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
            lon: data.lon || 0
        };
    } catch (error) {
        console.error('Error fetching IP-based location:', error);
        return {
            zip: '00000',
            city: 'Unknown',
            lat: 0,
            lon: 0
        };
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    // DOM Elements
    const locationDisplay = document.getElementById('current-location');
    const coordinatesDisplay = document.getElementById('current-coordinates');
    const currentPollutionDisplay = document.getElementById('current-pollution');
    const pollutantChartsContainer = document.getElementById('pollutant-charts');
    const manualZipInput = document.getElementById('manual-zip');
    const changeZipBtn = document.getElementById('change-zip-btn');
    const zipErrorDialog = document.getElementById('zip-error-dialog');
    const closeDialogBtn = document.getElementById('close-dialog-btn');

    if (!locationDisplay || !coordinatesDisplay || !currentPollutionDisplay || !pollutantChartsContainer || !manualZipInput || !changeZipBtn || !zipErrorDialog || !closeDialogBtn) {
        console.error("Missing essential DOM elements.");
        return;
    }

    // Load API key
    let OPENWEATHER_API_KEY = "";
    try {
        const res = await fetch('../config.json');
        if (!res.ok) throw new Error("Failed to load API key file");
        const config = await res.json();
        OPENWEATHER_API_KEY = config.OPENWEATHER_API_KEY;
        if (!OPENWEATHER_API_KEY) throw new Error("API key not found in configuration file");
    } catch (error) {
        console.error("Error loading API key:", error);
        return;
    }

    const GEO_API_BASE = "https://api.openweathermap.org/geo/1.0/zip";
    const AIR_API_BASE = "https://api.openweathermap.org/data/2.5/air_pollution";

    // Fetch coordinates from ZIP code
    async function fetchCoordinates(zip) {
        try {
            const res = await fetch(`${GEO_API_BASE}?zip=${zip},US&appid=${OPENWEATHER_API_KEY}`);
            if (!res.ok) throw new Error("Invalid ZIP code");
            const data = await res.json();
            return { lat: data.lat, lon: data.lon };
        } catch (error) {
            console.error("Error fetching coordinates:", error);
            zipErrorDialog.showModal();
            return null;
        }
    }

    // Fetch air pollution data
    async function fetchAirPollutionData(lat, lon) {
        try {
            const res = await fetch(`${AIR_API_BASE}?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}`);
            if (!res.ok) throw new Error("Failed to fetch air pollution data");
            const data = await res.json();

            const aqi = data.list[0].main.aqi;
            const pollutants = data.list[0].components;

            return { aqi, pollutants };
        } catch (error) {
            console.error("Error fetching air pollution:", error);
            return null;
        }
    }

    // Display pollution data
    async function displayPollutionData(zip) {
        try {
            const coords = await fetchCoordinates(zip);
            if (!coords) return;
    
            const { lat, lon } = coords;
            const pollutionData = await fetchAirPollutionData(lat, lon);
    
            if (!pollutionData) {
                currentPollutionDisplay.textContent = "Unable to retrieve air quality data.";
                return;
            }
    
            const { aqi, pollutants } = pollutionData;
            const aqiDescription = ["Good", "Fair", "Moderate", "Poor", "Very Poor"];
            currentPollutionDisplay.textContent = `AQI: ${aqi} (${aqiDescription[aqi - 1]})`;
    
            pollutantChartsContainer.innerHTML = ''; // Clear previous charts
    
            // Pollutant name mappings
            const pollutantNames = {
                co: "Carbon Monoxide (CO)",
                no: "Nitrogen Monoxide (NO)",
                no2: "Nitrogen Dioxide (NO2)",
                o3: "Ozone (O3)",
                so2: "Sulphur Dioxide (SO2)",
                pm2_5: "Particulates (PM2.5)",
                pm10: "Particulates (PM10)",
                nh3: "Ammonia (NH3)"
            };
    
            // Display pollutants as gauges
            Object.entries(pollutants).forEach(([key, value]) => {
                // Create container for the gauge
                const containerId = `gauge-${key}`;
                const gaugeContainer = document.createElement('div');
                gaugeContainer.id = containerId;
                gaugeContainer.className = 'gauge-container';
    
                // Add header with pollutant name and value
                const header = document.createElement('div');
                header.className = 'pollutant-header';
                header.innerHTML = `
                    <h3>${pollutantNames[key]}</h3>
                    <p>${value.toFixed(2)} μg/m³</p>
                `;
                gaugeContainer.appendChild(header);
    
                pollutantChartsContainer.appendChild(gaugeContainer);
    
                // Generate the gauge
                createGauge(containerId, value, key);
            });
        } catch (error) {
            console.error("Error displaying pollution data:", error);
        }
    }


    // Handle ZIP code change
    changeZipBtn.addEventListener('click', async () => {
        const newZip = manualZipInput.value.trim();
        if (/^\d{5}$/.test(newZip)) {
            const locationData = await fetchCoordinates(newZip);
            if (locationData) {
                const { lat, lon } = locationData;
                locationDisplay.textContent = `Lat: ${lat}, Lon: ${lon}`;
                coordinatesDisplay.textContent = `ZIP: ${newZip}`;
                await displayPollutionData(newZip);
            }
        } else {
            zipErrorDialog.showModal();
        }
    });

    // Close ZIP code error dialog
    closeDialogBtn.addEventListener('click', () => {
        zipErrorDialog.close();
    });

    // Initial load
    const locationData = await fetchUserLocationByIP();
    const { zip, city, lat, lon } = locationData;
    locationDisplay.textContent = `${city}, ${zip}`;
    coordinatesDisplay.textContent = `Lat: ${lat.toFixed(4)}, Lon: ${lon.toFixed(4)}`;
    await displayPollutionData(zip);
});
