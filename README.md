
Project Title: 
AeroLife 

Problem:
Unpredictable weather and air pollution are global challenges that affect millions of lives. Many cities struggle to monitor and communicate pollution levels effectively, leaving the public unaware of potential health risks. This lack of accessible, real-time information can lead to diminished quality of life, public health issues, and economic disruptions.

Product Descrption: 
Welcome to the AeroLife Web Application! AeroLife is a responsive and interactive platform designed to provide real-time environmental data to users, promoting eco-friendly and informed decision-making.

Purpose:
The primary goal of AeroLife is to empower users with real-time information about air quality and environmental conditions. By making such data easily accessible, the platform aims to foster awareness and inspire sustainable living practices.

Features:
Real-Time Data
Historical Insights
Eco-Friendly Living


Setup Instructions:
1.Clone the repository to your local machine.
2.Navigate to the project directory.

3.Create/ edit `config.json` file and populate it with:

```
{
    "OPENWEATHER_API_KEY": "YOUR_API_KEY"
  }
```

Air Quality Index Ranges:

Qualitative name	Index	Pollutant concentration in μg/m3
SO2	NO2	PM10	PM2.5	O3	CO
Good	1	[0; 20)	[0; 40)	[0; 20)	[0; 10)	[0; 60)	[0; 4400)
Fair	2	[20; 80)	[40; 70)	[20; 50)	[10; 25)	[60; 100)	[4400; 9400)
Moderate	3	[80; 250)	[70; 150)	[50; 100)	[25; 50)	[100; 140)	[9400-12400)
Poor	4	[250; 350)	[150; 200)	[100; 200)	[50; 75)	[140; 180)	[12400; 15400)
Very Poor	5	⩾350	⩾200	⩾200	⩾75	⩾180	⩾15400

Other parameters that do not affect the AQI calculation:
NH3: min value 0.1 - max value 200
NO: min value 0.1 - max value 100

https://openweathermap.org/api/air-pollution

Potentil APIs and resources:
https://developer.nrel.gov/docs/solar/solar-resource-v1/
https://www.amcharts.com/demos/
