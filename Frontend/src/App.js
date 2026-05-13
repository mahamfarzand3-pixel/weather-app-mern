import React, { useState } from 'react';
import axios from 'axios';

function App() {
  const [city, setCity] = useState('');
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [error, setError] = useState('');

  const getAllWeather = async () => {
    try {
      if (!city.trim()) {
        setError('Please enter a city name');
        return;
      }

      // Fetch current weather
      const weatherRes = await axios.get(`http://localhost:5000/weather/${city}`);
      setWeather(weatherRes.data);

      // Fetch forecast data
      const forecastRes = await axios.get(`http://localhost:5000/forecast/${city}`);
      
      // Additional safety filter: Ensure only 5 unique days are shown
      const cleanForecast = forecastRes.data.filter(item => item.dt_txt.includes("12:00:00")).slice(0, 5);
      setForecast(cleanForecast);

      setError('');
    } catch (err) {
      setError('City not found or server error');
      setWeather(null);
      setForecast([]);
    }
  };

  const getBackgroundStyle = () => {
    if (!weather) return 'linear-gradient(to bottom, #bdc3c7, #2c3e50)';
    const temp = weather.main.temp;
    if (temp > 30) return 'linear-gradient(to bottom, #ff512f, #f09819)';
    if (temp > 15) return 'linear-gradient(to bottom, #2980b9, #6dd5fa, #ffffff)';
    return 'linear-gradient(to bottom, #4ca1af, #c4e0e5)';
  };

  return (
    <div style={{ background: getBackgroundStyle(), minHeight: '100vh', textAlign: 'center', paddingTop: '50px', color: '#fff', paddingBottom: '50px' }}>
      <h1>Weather App</h1>
      
      <div style={{ marginBottom: '30px' }}>
        <input 
          type="text" 
          placeholder="Enter city..." 
          value={city} 
          onChange={(e) => setCity(e.target.value)}
          style={{ padding: '12px', borderRadius: '25px', border: 'none', width: '250px', color: '#000' }}
        />
        <button onClick={getAllWeather} style={{ padding: '12px 25px', marginLeft: '10px', borderRadius: '25px', cursor: 'pointer', border: 'none', fontWeight: 'bold' }}>
          Search
        </button>
      </div>

      {error && <p style={{ color: 'yellow' }}>{error}</p>}

      {/* Current Weather Card */}
      {weather && (
        <div style={{ padding: '30px', borderRadius: '20px', backgroundColor: 'rgba(255, 255, 255, 0.2)', backdropFilter: 'blur(10px)', display: 'inline-block', marginBottom: '40px', minWidth: '300px' }}>
          <h2>{weather.name} (Today)</h2>
          <p style={{ fontSize: '60px', fontWeight: 'bold', margin: '10px 0' }}>{Math.round(weather.main.temp)}°C</p>
          <p style={{ textTransform: 'capitalize' }}>{weather.weather[0].description}</p>
        </div>
      )}

      {/* 5 Day Forecast Section */}
      {forecast.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <h3>Next 5 Days Forecast</h3>
          <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'nowrap', gap: '15px', padding: '20px', overflowX: 'auto' }}>
            {forecast.map((item, index) => (
              <div key={index} style={{ padding: '20px', backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '15px', minWidth: '120px' }}>
                <p style={{ fontSize: '16px', margin: '0' }}>
                  {new Date(item.dt_txt).toLocaleDateString('en-GB', { weekday: 'short' })}
                </p>
                <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '10px 0' }}>{Math.round(item.main.temp)}°C</p>
                <p style={{ fontSize: '14px' }}>{item.weather[0].main}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;