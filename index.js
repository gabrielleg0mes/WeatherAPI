const express = require('express');
const axios = require('axios');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse URL-encoded and JSON bodies
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));

// Serve the form HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'form.html'));
});

// Handle form submission
app.post('/submit-form', async (req, res) => {
    const { country } = req.body; // Extract country from the request body
    console.log('Received country:', country);

    // Construct the URL for the OpenWeather Geocoding API
    const geoUrl = `http://api.openweathermap.org/geo/1.0/direct?q=${country}&limit=1&appid=${process.env.OPENWEATHER_API_KEY}`;

    try {
        const geoResponse = await axios.get(geoUrl);
        console.log('Geocoding API response:', geoResponse.data);

        // Check if the response contains any data
        if (geoResponse.data.length === 0) {
            return res.status(404).json({ error: 'Country not found.' });
        }

        const location = geoResponse.data[0]; // Get the first object in the array
        const { lat: latitude, lon: longitude } = location; // Destructure the location object

        // Construct the URL for the Weather API using the retrieved latitude and longitude
        const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${process.env.OPENWEATHER_API_KEY}&units=metric`;

        // Fetch weather data from the Weather API
        const weatherResponse = await axios.get(weatherUrl);
        console.log('Weather API response:', weatherResponse.data);

        // Extract relevant weather information
        const weatherData = {
            location: location.name,
            weather: weatherResponse.data.weather[0].description, // Weather description
            temperature: weatherResponse.data.main.temp, // Current temperature
            feels_like: weatherResponse.data.main.feels_like, // Feels like temperature
            humidity: weatherResponse.data.main.humidity, // Humidity
            pressure: weatherResponse.data.main.pressure, // Pressure
        };

        // Respond with the formatted weather data
        res.status(200).json(weatherData);

    } catch (error) {
        console.error('Error fetching data:', error);
        // Check if the error is due to a request failure or a different issue
        if (error.response) {
            return res.status(error.response.status).json({ error: error.response.data.message || 'An error occurred while fetching data.' });
        }
        res.status(500).json({ error: 'An unexpected error occurred.' });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});