document.addEventListener('DOMContentLoaded', async () => {
    let OPENWEATHER_API_KEY = "";

    // Load API Key from config.json
    try {
        const res = await fetch('config.json');
        if (!res.ok) throw new Error("Failed to load API key file");
        const config = await res.json();
        OPENWEATHER_API_KEY = config.OPENWEATHER_API_KEY;
        if (!OPENWEATHER_API_KEY) throw new Error("API key not found in configuration file");
    } catch (error) {
        console.error("Error loading API key:", error);
        return;
    }

    const cities = [
        { name: "Fresno", coords: [36.7378, -119.7871] },
        { name: "Washington, D.C.", coords: [38.9072, -77.0369] },
        { name: "New York City", coords: [40.7128, -74.0060] },
        { name: "Chicago", coords: [41.8781, -87.6298] },
        { name: "Miami", coords: [25.7617, -80.1918] },
        { name: "Dallas", coords: [32.7767, -96.7970] },
        { name: "Los Angeles", coords: [34.0522, -118.2437] },
        { name: "Seattle", coords: [47.6062, -122.3321] },
        { name: "Atlanta", coords: [33.7490, -84.3880] },
        { name: "Denver", coords: [39.7392, -104.9903] },
        { name: "Houston", coords: [29.7604, -95.3698] },
        { name: "Phoenix", coords: [33.4484, -112.0740] },
        { name: "Boston", coords: [42.3601, -71.0589] },
        { name: "San Francisco", coords: [37.7749, -122.4194] },
        { name: "Las Vegas", coords: [36.1699, -115.1398] },
        { id: "US-AK", name: "Anchorage", coords: [61.2181, -149.9003] },
        { id: "US-HI", name: "Honolulu", coords: [21.3069, -157.8583] },
    ];

    const map = L.map('map').setView([37.8, -96], 4);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
    }).addTo(map);

    // Adjust the map size after rendering
    setTimeout(() => {
        map.invalidateSize(); // Ensure Leaflet adjusts to container
    }, 100);

    function getColor(aqi) {
        const colors = ["#54b947", "#b0d136", "#fdae19", "#f04922", "#ee1f25"];
        return colors[aqi - 1] || "gray";
    }

    async function fetchAQIData(lat, lon) {
        const url = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}`;
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error("Failed to fetch AQI data");
            const data = await response.json();
            return data.list[0].main.aqi;
        } catch (error) {
            console.error("Error fetching AQI data:", error);
            return null;
        }
    }

    async function addCityMarkers() {
        for (const city of cities) {
            const aqi = await fetchAQIData(city.coords[0], city.coords[1]);
            if (aqi) {
                const color = getColor(aqi);
                const marker = L.circleMarker(city.coords, {
                    radius: 10,
                    color: color,
                    fillColor: color,
                    fillOpacity: 0.8,
                }).addTo(map);
                marker.bindPopup(`<b>${city.name}</b><br>AQI: ${aqi}`);
            }
        }
    }

    async function plotUserLocation() {
        try {
            const res = await fetch('http://ip-api.com/json/');
            if (!res.ok) throw new Error("Failed to fetch user location");
            const data = await res.json();
            const { lat, lon, city } = data;

            const aqi = await fetchAQIData(lat, lon);
            if (aqi) {
                const color = getColor(aqi);
                const userMarker = L.circleMarker([lat, lon], {
                    radius: 12,
                    color: color,
                    fillColor: color,
                    fillOpacity: 0.9,
                }).addTo(map);
                userMarker.bindPopup(`<b>Your Location</b><br>${city}<br>AQI: ${aqi}`).openPopup();
                map.setView([lat, lon], 8);
            }
        } catch (error) {
            console.error("Error plotting user location:", error);
        }
    }

    addCityMarkers();
    plotUserLocation();
});
