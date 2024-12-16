## **Aerolife**

## **Description**  
Aerolife is a responsive and interactive web application providing **real-time air quality data** and historical insights. Designed for eco-conscious users and urban dwellers, Aerolife empowers users with up-to-date air pollution data, promoting informed decisions and sustainable living.

## **Target Browsers**  
- **Desktop**: Chrome, Firefox, Safari, Edge  
- **Mobile**: Not currently optomixed for mobile browsers.

## **Links**  
- **Live Deployment**: [Deployed to Vercel](https://aerolife-git-testdeployment-jpapagias-projects.vercel.app/index.html)  
- **Developer Manual**: [Documentation Page](docs.html)  
- **GitHub Repository**: [GitHub](https://github.com/jpapagia/aerolife)

## **Key Features**
- **Real-Time Data**: Displays live air pollution and weather data.
- **Historical Insights**: Users can explore pollution trends over time.
- **User-Friendly Interface**: Interactive gauges and clean design.
- **Multiple Pollutants**: Monitors PM2.5, PM10, SO₂, NO₂, O₃, CO, and more.

### **Developer Manual**

## **Installation**
To install Aerolife locally, follow these steps:

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/jpapagia/aerolife.git && cd aerolife
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Set Configuration**:
   - Create a `config.json` file in the root directory:
     ```json
     {
       "OPENWEATHER_API_KEY": "your_openweather_api_key",
       "SUPABASE_PROJECT_URL": "your_supabase_project_url",
       "SUPABASE_ANON_KEY": "your_supabase_anon_key"
     }
     ```

## **Running the Application**
Start the application on your local server:

```bash
npm start
```

The app runs on `http://localhost:5500` for local deployment. If using a local deployment, pull from the dev or main channels. For Vercel deployment, use the test-deployment branch. The local deployment uses a config.json file, whihh shuld be populated with the corresponding API keys and Supabase access.


## **API Endpoints**
### **1. Get Historical Air Quality Data**
- **Method**: `GET`  
- **Endpoint**: `/api/historical`  
- **Description**: Retrieves historical air quality data.  
- **Parameters**:
   - `lat`: Latitude  
   - `lon`: Longitude  


### **2. Post User Feedback**
- **Method**: `POST`  
- **Endpoint**: `/api/feedback`  
- **Description**: Collects user feedback and writes to the database.  
- **Request Body**:
   ```json
   {
     "name": "User Name",
     "feedback": "Your feedback message"
   }
   ```

## **Known Bugs**
- Gauges do not load properly on Core page
- Historical data and caching on deployment refusing to load properly
- Home page scrolling


## **Future Roadmap**
- Add forcast for future AQI values
- Configure for mobile use (Safari, Chrome)
- Improve syles and consistency.

## **Testing**
To test the application:

1. Run tests using:
   ```bash
   npm test
   ```
2. View the results in the terminal or generated test reports.


### **Additional Notes**
- **Libraries Used**:
   - FetchAPI (location)
   - AmCharts (gauges)
   - Leaflet (maps)
   - FontAwesome (location icons)

- **External APIs**:
   - [OpenWeather Air Pollution API](https://openweathermap.org/api/air-pollution)
   - IP-API for location services

## **Pollutants Monitored**
- **Sulfur Dioxide (SO₂):** Produced from burning fossil fuels; can cause respiratory issues.
- **Nitrogen Dioxide (NO₂):** Emitted from vehicle exhaust and industrial processes; contributes to smog and respiratory issues.
- **Particulate Matter (PM10 and PM2.5):** Suspended fine particles that penetrate deep into the lungs.
- **Ozone (O₃):** Formed in sunlight; high levels irritate the respiratory system.
- **Carbon Monoxide (CO):** Reduces oxygen delivery to the body.

### **Air Quality Index (AQI) Thresholds**
| Category     | Index | SO₂ (µg/m³) | NO₂ (µg/m³) | PM10 (µg/m³) | PM2.5 (µg/m³) | O₃ (µg/m³) | CO (µg/m³) |
|--------------|-------|-----------------|-----------------|-----------------|-----------------|-----------------|-----------------|
| **Good**    | 1     | [0; 20)         | [0; 40)         | [0; 20)         | [0; 10)         | [0; 60)         | [0; 4400)       |
| **Fair**    | 2     | [20; 80)        | [40; 70)        | [20; 50)        | [10; 25)        | [60; 100)       | [4400; 9400)    |
| **Moderate**| 3     | [80; 250)       | [70; 150)       | [50; 100)       | [25; 50)        | [100; 140)      | [9400; 12400)   |
| **Poor**    | 4     | [250; 350)      | [150; 200)      | [100; 200)      | [50; 75)        | [140; 180)      | [12400; 15400)  |
| **Very Poor**| 5     | ≥350           | ≥200           | ≥200           | ≥75            | ≥180           | ≥15400         |
