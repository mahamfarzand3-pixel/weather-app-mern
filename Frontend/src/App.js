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

      // 1. Fetch Today's Weather
      const weatherRes = await axios.get(`http://localhost:5000/weather/${city}`);
      setWeather(weatherRes.data);

      // 2. Fetch Forecast
      const forecastRes = await axios.get(`http://localhost:5000/forecast/${city}`);
      
      // Local System ki date nikalne ka sahi tareeqa (YYYY-MM-DD)
      const now = new Date();
      const localToday = now.getFullYear() + '-' + 
                         String(now.getMonth() + 1).padStart(2, '0') + '-' + 
                         String(now.getDate()).padStart(2, '0');

      const dailyData = new Map();

      forecastRes.data.forEach(item => {
        // API se date nikalna (e.g., "2026-05-14")
        const datePart = item.dt_txt.split(' ')[0];
        
        // Agar yeh date "Aaj" nahi hai, tabhi cards mein dalna hai
        if (datePart !== localToday) {
          // Agar us din ki midday (12:00) entry mil jaye to wo best hai
          if (!dailyData.has(datePart) || item.dt_txt.includes("12:00:00")) {
            dailyData.set(datePart, item);
          }
        }
      });

      // Map ko array mein convert karke sort karna aur 5 din nikalna
      const finalForecast = Array.from(dailyData.values())
        .sort((a, b) => new Date(a.dt_txt.replace(/-/g, "/")) - new Date(b.dt_txt.replace(/-/g, "/")))
        .slice(0, 5);
      
      setForecast(finalForecast);
      setError('');
    } catch (err) {
      setError('City not found or server error');
      setWeather(null);
      setForecast([]);
    }
  };

  // Din ka naam nikalne ka function (Fixed for Timezone)
  const getDayName = (dateString) => {
    const [year, month, day] = dateString.split(' ')[0].split('-');
    const date = new Date(year, month - 1, day); // Manual date creation (safe)
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
      <h1>Weather App</h1>
      
      <div style={{ marginBottom: '30px' }}>
        <input 
          type="text" 
          placeholder="Enter city..." 
          value={city} 
          onChange={(e) => setCity(e.target.value)}
          style={{ padding: '12px', borderRadius: '25px', border: 'none', width: '250px', color: '#000', outline: 'none' }}
        />
        <button onClick={getAllWeather} style={{ padding: '12px 25px', marginLeft: '10px', borderRadius: '25px', cursor: 'pointer', border: 'none', fontWeight: 'bold', backgroundColor: '#fff', color: '#333' }}>
          Search
        </button>
      </div>

      {error && <p style={{ color: '#ffeb3b', fontWeight: 'bold' }}>{error}</p>}

      {weather && (
        <div style={{ padding: '30px', borderRadius: '20px', backgroundColor: 'rgba(255, 255, 255, 0.2)', backdropFilter: 'blur(10px)', display: 'inline-block', marginBottom: '40px', minWidth: '320px', boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)' }}>
          <h2>{weather.name} (Today)</h2>
          <p style={{ fontSize: '60px', fontWeight: 'bold', margin: '10px 0' }}>{Math.round(weather.main.temp)}°C</p>
          <p style={{ textTransform: 'capitalize', fontSize: '18px' }}>{weather.weather[0].description}</p>
        </div>
      )}

      {forecast.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <h3>Next 5 Days Forecast</h3>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', padding: '20px', flexWrap: 'wrap' }}>
            {forecast.map((item, index) => (
              <div key={index} style={{ padding: '20px', backgroundColor: 'rgba(255, 255, 255, 0.15)', borderRadius: '15px', minWidth: '130px', backdropFilter: 'blur(5px)' }}>
                <p style={{ fontSize: '16px', margin: '0', fontWeight: 'bold' }}>
                  {getDayName(item.dt_txt)}
                </p>
                <p style={{ fontSize: '28px', fontWeight: 'bold', margin: '10px 0' }}>{Math.round(item.main.temp)}°C</p>
                <p style={{ fontSize: '14px', textTransform: 'capitalize' }}>{item.weather[0].main}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;