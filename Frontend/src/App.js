import React, { useState } from 'react';
import axios from 'axios';

function App() {
  const [city, setCity] = useState('');
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [error, setError] = useState('');
  const [isCelsius, setIsCelsius] = useState(true);

  // NEW STATE: To track which detail (Humidity, Wind, or Feels Like) to show
  const [activeDetail, setActiveDetail] = useState('feels_like');

  const getAllWeather = async () => {
    try {
      if (!city.trim()) {
        setError('Please enter a city name');
        return;
      }
      const weatherRes = await axios.get(`http://localhost:5000/weather/${city}`);
      const forecastRes = await axios.get(`http://localhost:5000/forecast/${city}`);
      
      setWeather(weatherRes.data);
      
      // Logic to filter 5-day forecast
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const dailyData = new Map();
      forecastRes.data.forEach(item => {
        const itemDate = new Date(item.dt_txt.replace(/-/g, "/"));
        const itemDateOnly = new Date(itemDate);
        itemDateOnly.setHours(0, 0, 0, 0);
        if (itemDateOnly > today) {
          const dateString = itemDateOnly.toISOString().split('T')[0];
          if (!dailyData.has(dateString) || item.dt_txt.includes("12:00:00")) {
            dailyData.set(dateString, item);
          }
        }
      });
      setForecast(Array.from(dailyData.values()).slice(0, 5));
      setError('');
    } catch (err) {
      setError('City not found or server error');
      setWeather(null);
      setForecast([]);
    }
  };

  // Function to convert and format temperature display
  const displayTemp = (temp) => {
    if (isCelsius) return Math.round(temp) + '°C';
    const fahrenheit = (temp * 9) / 5 + 32;
    return Math.round(fahrenheit) + '°F';
  };

  const getDayName = (dateString) => {
    const date = new Date(dateString.replace(/-/g, "/"));
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  };

  const getBackgroundStyle = () => {
    if (!weather) return 'linear-gradient(to bottom, #bdc3c7, #2c3e50)';
    const temp = weather.main.temp;
    if (temp > 30) return 'linear-gradient(to bottom, #ff512f, #f09819)';
    if (temp > 15) return 'linear-gradient(to bottom, #2980b9, #6dd5fa, #ffffff)';
    return 'linear-gradient(to bottom, #4ca1af, #c4e0e5)';
  };

  return (
    <div style={{ background: getBackgroundStyle(), minHeight: '100vh', textAlign: 'center', paddingTop: '50px', color: '#fff', paddingBottom: '50px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Weather App Pro</h1>
      
      {/* Search Section */}
      <div style={{ marginBottom: '30px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
        <input 
          type="text" 
          placeholder="Enter city..." 
          value={city} 
          onChange={(e) => setCity(e.target.value)}
          style={{ padding: '12px', borderRadius: '25px', border: 'none', width: '250px', outline: 'none' }}
        />
        <button onClick={getAllWeather} style={{ padding: '12px 20px', borderRadius: '25px', cursor: 'pointer', border: 'none', fontWeight: 'bold', backgroundColor: '#fff' }}>
          Search
        </button>
        <button onClick={() => setIsCelsius(!isCelsius)} style={{ padding: '12px 15px', borderRadius: '25px', cursor: 'pointer', border: 'none', fontWeight: 'bold', backgroundColor: '#fff', color: '#333' }}>
          {isCelsius ? '°F' : '°C'}
        </button>
      </div>

      {error && <p style={{ color: '#ffeb3b', fontWeight: 'bold' }}>{error}</p>}

      {weather && (
        <div style={{ padding: '30px', borderRadius: '20px', backgroundColor: 'rgba(255, 255, 255, 0.2)', backdropFilter: 'blur(10px)', display: 'inline-block', marginBottom: '20px', minWidth: '350px', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
          <h2>{weather.name}</h2>
          <p style={{ fontSize: '60px', fontWeight: 'bold', margin: '5px 0' }}>{displayTemp(weather.main.temp)}</p>
          <p style={{ textTransform: 'capitalize', fontSize: '18px', marginBottom: '20px' }}>{weather.weather[0].description}</p>
          
          {/* EXTRA INFO BUTTONS SECTION */}
          <div style={{ display: 'flex', justifyContent: 'space-around', borderTop: '1px solid rgba(255,255,255,0.3)', paddingTop: '20px' }}>
            <button onClick={() => setActiveDetail('feels_like')} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', opacity: activeDetail === 'feels_like' ? 1 : 0.6 }}>
              <div style={{ fontSize: '20px' }}>🌡️</div>
              <small>Feels Like</small>
            </button>
            <button onClick={() => setActiveDetail('humidity')} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', opacity: activeDetail === 'humidity' ? 1 : 0.6 }}>
              <div style={{ fontSize: '20px' }}>💧</div>
              <small>Humidity</small>
            </button>
            <button onClick={() => setActiveDetail('wind')} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', opacity: activeDetail === 'wind' ? 1 : 0.6 }}>
              <div style={{ fontSize: '20px' }}>💨</div>
              <small>Wind</small>
            </button>
          </div>

          {/* DYNAMIC DETAIL DISPLAY */}
          <div style={{ marginTop: '15px', fontSize: '22px', fontWeight: 'bold' }}>
            {activeDetail === 'feels_like' && `Feels Like: ${displayTemp(weather.main.feels_like)}`}
            {activeDetail === 'humidity' && `Humidity: ${weather.main.humidity}%`}
            {activeDetail === 'wind' && `Wind Speed: ${weather.wind.speed} m/s`}
          </div>
        </div>
      )}

      {/* Forecast Section */}
      {forecast.length > 0 && (
        <div style={{ marginTop: '30px' }}>
          <h3>Next 5 Days</h3>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', padding: '20px', flexWrap: 'wrap' }}>
            {forecast.map((item, index) => (
              <div key={index} style={{ padding: '15px', backgroundColor: 'rgba(255, 255, 255, 0.15)', borderRadius: '15px', minWidth: '110px' }}>
                <p style={{ fontWeight: 'bold', margin: '0' }}>{getDayName(item.dt_txt)}</p>
                <p style={{ fontSize: '22px', fontWeight: 'bold', margin: '10px 0' }}>{displayTemp(item.main.temp)}</p>
                <p style={{ fontSize: '12px', margin: '0' }}>{item.weather[0].main}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;