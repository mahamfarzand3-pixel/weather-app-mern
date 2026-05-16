const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());

const API_KEY = process.env.API_KEY;

// Route 1: Search by City Name (Used for the Search Input)
app.get('/weather/:city', async (req, res) => {
    try {
        const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${req.params.city}&appid=${API_KEY}&units=metric`);
        res.json(response.data);
    } catch (error) {
        res.status(404).json({ message: "City not found" });
    }
});

// Route 2: Forecast by City Name
app.get('/forecast/:city', async (req, res) => {
    try {
        const response = await axios.get(`https://api.openweathermap.org/data/2.5/forecast?q=${req.params.city}&appid=${API_KEY}&units=metric`);
        res.json(response.data.list);
    } catch (error) {
        res.status(404).json({ message: "Forecast not found" });
    }
});

// Route 3: Safe Current Weather by Coords
app.get('/weather/coords', async (req, res) => {
    const { lat, lon } = req.query;
    if (!lat || !lon) {
        return res.status(400).json({ error: "Invalid coordinates provided" });
    }
    try {
        const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`);
        res.json(response.data);
    } catch (error) {
        console.error("OWM Coords Weather Error:", error.message);
        res.status(404).json({ error: "Could not find weather for these coordinates" });
    }
});

// Route 4: Safe Forecast by Coords
app.get('/forecast/coords', async (req, res) => {
    const { lat, lon } = req.query;
    if (!lat || !lon) {
        return res.status(400).json({ error: "Invalid coordinates provided" });
    }
    try {
        const response = await axios.get(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`);
        res.json(response.data.list);
    } catch (error) {
        console.error("OWM Coords Forecast Error:", error.message);
        res.status(504).json({ error: "Could not find forecast for these coordinates" });
    }
});

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});