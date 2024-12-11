document.addEventListener('DOMContentLoaded', async () => {
    // Fetch API Key from config.json
    let OPENWEATHER_API_KEY = "";
    try {
        const res = await fetch('../config.json'); // Adjust path if needed
        if (!res.ok) throw new Error("Failed to load API key file");
        const config = await res.json();
        OPENWEATHER_API_KEY = config.OPENWEATHER_API_KEY;
        if (!OPENWEATHER_API_KEY) throw new Error("API key not found in configuration file");
    } catch (error) {
        console.error("Error loading API key:", error);
        return;
    }

    let currentLat = null;
    let currentLon = null;

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
        const url = `http://api.openweathermap.org/geo/1.0/zip?zip=${zip},US&appid=${OPENWEATHER_API_KEY}`;
        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error("Invalid ZIP code or data unavailable.");
            const data = await res.json();
            return { lat: data.lat, lon: data.lon };
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

    // Map of formal pollutant names
    const pollutantNames = {
        co: "Carbon Monoxide",
        no: "Nitrogen Monoxide",
        no2: "Nitrogen Dioxide",
        o3: "Ozone",
        so2: "Sulfur Dioxide",
        pm2_5: "Fine Particulate Matter (PM2.5)",
        pm10: "Coarse Particulate Matter (PM10)",
        nh3: "Ammonia",
    };

    // Fetch historical AQI data
    async function fetchHistoricalAQIData(lat, lon, start, end) {
        const url = `http://api.openweathermap.org/data/2.5/air_pollution/history?lat=${lat}&lon=${lon}&start=${start}&end=${end}&appid=${OPENWEATHER_API_KEY}`;
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Error: ${response.statusText}`);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error("Failed to fetch historical AQI data:", error);
            return null;
        }
    }

    // Prepare data for Chart.js
    function prepareChartData(aqiData) {
        const labels = [];
        const aqiValues = [];
        const additionalInfo = [];

        aqiData.list.forEach((entry, index) => {
            const date = new Date(entry.dt * 1000);
            labels.push(date.toLocaleString()); // Format date for labels
            aqiValues.push(entry.main.aqi); // Scale is 1 (Good) to 5 (Poor)
            additionalInfo.push({
                dt: entry.dt,
                delta: index === 0 ? 0 : entry.dt - aqiData.list[index - 1].dt, // Delta in seconds
                pollutants: entry.components,
            });
        });

        return { labels, aqiValues, additionalInfo };
    }

    // Track chart instances to destroy them before rendering new ones
    let dayChartInstance = null;
    let rangeChartInstance = null;

    // Render AQI chart using Chart.js
    function renderAQIChart(canvasId, labels, data, chartLabel, additionalInfo) {
        const ctx = document.getElementById(canvasId).getContext('2d');

        // Destroy the existing chart if it exists
        if (canvasId === 'dayChart' && dayChartInstance) {
            dayChartInstance.destroy();
        } else if (canvasId === 'rangeChart' && rangeChartInstance) {
            rangeChartInstance.destroy();
        }

        // Create a new chart
        const newChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: chartLabel,
                        data: data,
                        borderColor: 'rgba(75, 192, 192, 1)',
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        fill: true,
                    },
                ],
            },
            options: {
                responsive: true,
                plugins: {
                    tooltip: {
                        enabled: false, // Disable the default tooltip
                        external: function (context) {
                            let tooltipEl = document.getElementById('chartjs-tooltip');
                            if (!tooltipEl) {
                                tooltipEl = document.createElement('div');
                                tooltipEl.id = 'chartjs-tooltip';
                                tooltipEl.style.position = 'absolute';
                                tooltipEl.style.background = 'rgba(0, 0, 0, 0.7)';
                                tooltipEl.style.color = 'white';
                                tooltipEl.style.padding = '10px';
                                tooltipEl.style.borderRadius = '5px';
                                tooltipEl.style.pointerEvents = 'none';
                                tooltipEl.style.zIndex = '100';
                                tooltipEl.style.whiteSpace = 'pre-wrap';
                                document.body.appendChild(tooltipEl);
                            }

                            const tooltipModel = context.tooltip;
                            if (tooltipModel.opacity === 0) {
                                tooltipEl.style.opacity = '0';
                                return;
                            }

                            const dataPoint = tooltipModel.dataPoints[0];
                            const index = dataPoint.dataIndex;
                            const pollutants = additionalInfo[index].pollutants;
                            const dt = new Date(additionalInfo[index].dt * 1000).toLocaleString();
                            const delta = additionalInfo[index].delta;

                            let content = `<strong>AQI:</strong> ${dataPoint.raw}<br><strong>Date:</strong> ${dt}<br><strong>Delta:</strong> ${delta} seconds<br><strong>Pollutants:</strong><br>`;
                            for (const [key, value] of Object.entries(pollutants)) {
                                const formalName = pollutantNames[key] || key;
                                content += ` - ${formalName}: ${value}<br>`;
                            }
                            tooltipEl.innerHTML = content;

                            const canvasRect = context.chart.canvas.getBoundingClientRect();
                            const tooltipY = canvasRect.top + window.scrollY + tooltipModel.caretY;
                            const tooltipX = canvasRect.left + window.scrollX + tooltipModel.caretX;
                            tooltipEl.style.opacity = '1';
                            tooltipEl.style.top = `${tooltipY}px`;
                            tooltipEl.style.left = `${tooltipX}px`;
                        },
                    },
                },
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

        if (canvasId === 'dayChart') dayChartInstance = newChart;
        else if (canvasId === 'rangeChart') rangeChartInstance = newChart;
    }

    // Update all graphs
    async function updateGraphs(lat, lon) {
        const now = Math.floor(Date.now() / 1000);
        const oneDayAgo = now - 24 * 60 * 60;
        const oneYearAgo = now - 365 * 24 * 60 * 60;

        // Update Past 24 Hours Graph
        const dayData = await fetchHistoricalAQIData(lat, lon, oneDayAgo, now);
        if (dayData && dayData.list.length > 0) {
            const { labels, aqiValues, additionalInfo } = prepareChartData(dayData);
            renderAQIChart('dayChart', labels, aqiValues, `AQI for the Past 24 Hours`, additionalInfo);
        } else {
            console.warn("No data available for the past 24 hours.");
        }

        // Update Past Year Graph
        const yearData = await fetchHistoricalAQIData(lat, lon, oneYearAgo, now);
        if (yearData && yearData.list.length > 0) {
            const { labels, aqiValues, additionalInfo } = prepareChartData(yearData);
            renderAQIChart('rangeChart', labels, aqiValues, `AQI for the Past Year`, additionalInfo);
        } else {
            console.warn("No data available for the past year.");
            // Optionally, you can clear or hide the chart here
        }
    }

    // Handle ZIP code change
    document.getElementById('change-zip-btn').addEventListener('click', async () => {
        const zip = document.getElementById('manual-zip').value.trim();
        if (!/^\d{5}$/.test(zip)) {
            alert("Please enter a valid 5-digit ZIP code.");
            return;
        }

        const coords = await fetchCoordinatesFromZip(zip);
        if (coords) {
            currentLat = coords.lat;
            currentLon = coords.lon;
            document.getElementById('current-location').textContent = `Lat: ${coords.lat}, Lon: ${coords.lon}`;
            document.getElementById('current-coordinates').textContent = `Lat: ${coords.lat}, Lon: ${coords.lon}`;
            await updateGraphs(currentLat, currentLon);
        } else {
            alert("Failed to fetch data for the provided ZIP code.");
        }
    });

    // Fetch initial location and load graphs
    const initialLocation = await fetchUserLocation();
    if (initialLocation) {
        currentLat = initialLocation.lat;
        currentLon = initialLocation.lon;
        await updateGraphs(currentLat, currentLon);
    }

    // Handle past 24 hours form submission
    document.getElementById('dayForm').addEventListener('submit', async (event) => {
        event.preventDefault();
        const date = document.getElementById('dayInput').value || new Date().toISOString().split('T')[0];
        const startTimestamp = convertDateToUnix(`${date}T00:00:00`);
        const endTimestamp = convertDateToUnix(`${date}T23:59:59`);
        const data = await fetchHistoricalAQIData(currentLat, currentLon, startTimestamp, endTimestamp);
        if (data && data.list.length > 0) {
            const { labels, aqiValues, additionalInfo } = prepareChartData(data);
            renderAQIChart('dayChart', labels, aqiValues, `AQI for ${date}`, additionalInfo);
        } else {
            console.warn("No data available for the selected day.");
        }
    });

    // Handle past year form submission
    document.getElementById('rangeForm').addEventListener('submit', async (event) => {
        event.preventDefault();
        const startDate = document.getElementById('startDateInput').value;
        const endDate = document.getElementById('endDateInput').value;

        if (!startDate || !endDate) {
            alert("Please select both start and end dates.");
            return;
        }

        const startTimestamp = convertDateToUnix(`${startDate}T00:00:00`);
        const endTimestamp = convertDateToUnix(`${endDate}T23:59:59`);
        const data = await fetchHistoricalAQIData(currentLat, currentLon, startTimestamp, endTimestamp);
        if (data && data.list.length > 0) {
            const { labels, aqiValues, additionalInfo } = prepareChartData(data);
            renderAQIChart('rangeChart', labels, aqiValues, `AQI from ${startDate} to ${endDate}`, additionalInfo);
        } else {
            console.warn("No data available for the selected date range.");
        }
    });
});
