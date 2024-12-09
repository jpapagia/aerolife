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
    const closeDialogBtn = zipErrorDialog.querySelector('.close-btn');

    if (!locationDisplay || !coordinatesDisplay || !currentPollutionDisplay || !pollutantChartsContainer || !manualZipInput || !changeZipBtn || !zipErrorDialog || !closeDialogBtn) {
        console.error("Missing essential DOM elements.");
        return;
    }

    // Show ZIP code error
    function showZipError() {
        zipErrorDialog.classList.add('show');
        setTimeout(() => {
            zipErrorDialog.classList.remove('show');
        }, 7000); // Automatically hide after 7 seconds
    }

    // Close ZIP code error
    closeDialogBtn.addEventListener('click', () => {
        zipErrorDialog.classList.remove('show');
    });
    

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
            return { lat: data.lat, lon: data.lon, city: data.name || "Unknown" };
        } catch (error) {
            console.error("Error fetching coordinates:", error);
            showZipError();
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
            const aqiColors = ["#54b947", "#b0d136", "#fdae19", "#f04922", "#ee1f25"]; // Matching key colors

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

            // Display pollutants as gauges
            Object.entries(pollutants).forEach(([key, value]) => {
                const containerId = `gauge-${key}`;
                const gaugeContainer = document.createElement('div');
                gaugeContainer.id = containerId;
                gaugeContainer.className = 'gauge-container';

                function getFullName(key) {
                    const names = {
                        co: "Carbon Monoxide (CO)",
                        no: "Nitrogen Monoxide (NO)",
                        no2: "Nitrogen Dioxide (NO2)",
                        o3: "Ozone (O3)",
                        so2: "Sulphur Dioxide (SO2)",
                        pm2_5: "Particulates (PM2.5)",
                        pm10: "Particulates (PM10)",
                        nh3: "Ammonia (NH3)",
                    };
                    return names[key] || key.toUpperCase();
                }
                // Add pollutant header
                const pollutantName = getFullName(key);
                const header = document.createElement('div');
                header.className = 'pollutant-header';
                header.innerHTML = `
                    <h3>${pollutantName}</h3>
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
                const { lat, lon, city } = locationData;
            
                coordinatesDisplay.textContent = `Lat: ${lat.toFixed(4)}, Lon: ${lon.toFixed(4)}`;
                locationDisplay.textContent = `City: ${city}, ZIP: ${newZip}`;
                await displayPollutionData(newZip);
            }
            
        } else {
            showZipError();
        }
    });
    

    // Initial load
    const locationData = await fetchUserLocationByIP();
    const { zip, city, lat, lon } = locationData;
    locationDisplay.textContent = `${city}, ${zip}`;
    coordinatesDisplay.textContent = `Lat: ${lat.toFixed(4)}, Lon: ${lon.toFixed(4)}`;
    await displayPollutionData(zip);
});
