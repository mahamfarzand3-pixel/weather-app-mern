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

// Route 3: Current Weather by Coords (For Auto-Location)
app.get('/weather/coords', async (req, res) => {
    const { lat, lon } = req.query;
    try {
        const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: "Error fetching weather" });
    }
});

// Route 4: Forecast by Coords
app.get('/forecast/coords', async (req, res) => {
    const { lat, lon } = req.query;
    try {
        const response = await axios.get(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`);
        res.json(response.data.list);
    } catch (error) {
        res.status(500).json({ error: "Error" });
    }
});

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});