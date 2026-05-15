const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Enable CORS so the Frontend (React) can communicate with this Backend
app.use(cors());

// Retrieve the API Key from your .env file
const API_KEY = process.env.API_KEY;

/** * ROUTE 1: Fetch Current Weather by City Name 
 * Used when the user types a name and clicks 'Search'
 */
app.get('/weather/:city', async (req, res) => {
    try {
        const city = req.params.city;
        const response = await axios.get(
            `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`
        );
        res.json(response.data);
    } catch (error) {
        // Send 404 if city name is invalid
        res.status(404).json({ message: "City not found" });
    }
});

/** * ROUTE 2: Fetch 5-Day Forecast by City Name 
 */
app.get('/forecast/:city', async (req, res) => {
    try {
        const city = req.params.city;
        const response = await axios.get(
            `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=metric`
        );
        res.json(response.data.list);
    } catch (error) {
        res.status(404).json({ message: "Forecast data not found" });
    }
});

/** * ROUTE 3: Fetch Current Weather by Coordinates (Lat/Lon)
 * Used when the user clicks the 📍 Location button
 */
app.get('/weather/coords', async (req, res) => {
    const { lat, lon } = req.query;
    try {
        const response = await axios.get(
            `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
        );
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ message: "Error fetching weather for these coordinates" });
    }
});

/** * ROUTE 4: Fetch 5-Day Forecast by Coordinates (Lat/Lon)
 */
app.get('/forecast/coords', async (req, res) => {
    const { lat, lon } = req.query;
    try {
        const response = await axios.get(
            `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
        );
        res.json(response.data.list);
    } catch (error) {
        res.status(500).json({ message: "Error fetching forecast for these coordinates" });
    }
});

// Start the server on Port 5000
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});