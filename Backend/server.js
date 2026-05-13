const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 5000;

app.get('/weather/:city', async (req, res) => {
    try {
        const city = req.params.city;
        const API_KEY = 'c966af56d387260ffc8f6ceed698ad5'; 
        const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${API_KEY}`);
        res.json(response.data);
    } catch (error) {
        console.error('Weather API Error:', error.message);
        res.status(error.response?.status || 500).json({ message: "City not found" });
    }
});

app.get('/forecast/:city', async (req, res) => {
    try {
        const city = req.params.city;
        const API_KEY = 'c966af56d387260ffc8f6ceed698ad5';
        const response = await axios.get(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&appid=${API_KEY}`);
        
        // Filter to get only one reading per day (at 12:00 PM)
        const filteredData = response.data.list.filter(item => item.dt_txt.includes("12:00:00"));
        
        res.json(filteredData);
    } catch (error) {
        console.error('Forecast API Error:', error.message);
        res.status(error.response?.status || 500).json({ message: "Forecast error" });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});