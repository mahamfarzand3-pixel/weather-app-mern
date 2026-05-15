import React, { useState } from 'react';
import axios from 'axios';

function App() {
  const [city, setCity] = useState('');
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [error, setError] = useState('');
  const [isCelsius, setIsCelsius] = useState(true);
  const [activeDetail, setActiveDetail] = useState('feels_like');

  const getAllWeather = async () => {
    try {
      if (!city.trim()) {
        setError('Please enter a city or country name.');
        setWeather(null);
        setForecast([]);
        return;
      }
      setError('');
      const weatherRes = await axios.get(`http://localhost:5000/weather/${city}`);
      const forecastRes = await axios.get(`http://localhost:5000/forecast/${city}`);
      setWeather(weatherRes.data);
      processForecastData(forecastRes.data);
      setActiveDetail('feels_like');
    } catch (err) {
      setError('Location not found. Try again!');
      setWeather(null);
      setForecast([]);
    }
  };

  const processForecastData = (forecastList) => {
    const dailyDataMap = new Map();
    forecastList.forEach(item => {
      const dateKey = item.dt_txt.split(' ')[0];
      if (!dailyDataMap.has(dateKey) || item.dt_txt.includes("12:00:00")) {
        dailyDataMap.set(dateKey, item);
      }
    });
    setForecast(Array.from(dailyDataMap.values()).slice(1, 6));
  };

  const displayTemp = (temp) => {
    if (isCelsius) return Math.round(temp) + '°C';
    return Math.round((temp * 9) / 5 + 32) + '°F';
  };

  const getDayName = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', { weekday: 'short' });
  };

  // Styles for a "Glass" look
  const glassStyle = {
    background: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center',
      background: '#0f172a', // Dark theme base
      position: 'relative',
      overflow: 'hidden',
      fontFamily: "'Poppins', sans-serif"
    }}>
      
      {/* Animated Decorative Blobs for Background */}
      <div style={{ position: 'absolute', width: '400px', height: '400px', background: '#3b82f6', borderRadius: '50%', top: '-100px', right: '-100px', filter: 'blur(80px)', opacity: 0.4, zIndex: 0 }}></div>
      <div style={{ position: 'absolute', width: '300px', height: '300px', background: '#9333ea', borderRadius: '50%', bottom: '-50px', left: '-50px', filter: 'blur(80px)', opacity: 0.3, zIndex: 0 }}></div>

      <div style={{ width: '90%', maxWidth: '900px', zIndex: 1, padding: '20px' }}>
        
        <h1 style={{ color: '#fff', textAlign: 'center', fontSize: '3rem', fontWeight: '800', marginBottom: '30px', textShadow: '0 4px 10px rgba(0,0,0,0.3)' }}>
          Weather <span style={{ color: '#3b82f6' }}>App Pro</span>
        </h1>

        {/* Search Section */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '40px' }}>
          <input 
            type="text" 
            placeholder="Search location..." 
            value={city} 
            onChange={(e) => setCity(e.target.value)}
            style={{ 
              padding: '15px 25px', borderRadius: '50px', border: 'none', width: '60%', 
              background: 'rgba(255,255,255,0.9)', fontSize: '1.1rem', outline: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' 
            }}
          />
          <button onClick={getAllWeather} style={{ padding: '15px 30px', borderRadius: '50px', border: 'none', background: '#3b82f6', color: '#fff', fontWeight: 'bold', cursor: 'pointer', transition: '0.3s' }}>
            Search
          </button>
          <button onClick={() => setIsCelsius(!isCelsius)} style={{ padding: '15px', width: '60px', borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}>
            {isCelsius ? '°F' : '°C'}
          </button>
        </div>

        {/* Main Weather Card */}
        <div style={{ ...glassStyle, borderRadius: '30px', padding: '50px', textAlign: 'center', color: '#fff' }}>
          
          {!weather && !error && (
            <div style={{ opacity: 0.8 }}>
              <div style={{ fontSize: '100px', marginBottom: '20px' }}>☁️</div>
              <h2>Ready to check the weather?</h2>
              <p>Type a city and hit search to see the magic.</p>
            </div>
          )}

          {error && <h3 style={{ color: '#f87171' }}>{error}</h3>}

          {weather && (
            <>
              <h2 style={{ fontSize: '2.5rem', marginBottom: '10px' }}>{weather.name}</h2>
              <h1 style={{ fontSize: '6rem', margin: '0', fontWeight: 'bold' }}>{displayTemp(weather.main.temp)}</h1>
              <p style={{ fontSize: '1.5rem', textTransform: 'capitalize', color: '#94a3b8' }}>{weather.weather[0].description}</p>

              {/* Extra Details Selector */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '40px', marginTop: '40px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '30px' }}>
                <div onClick={() => setActiveDetail('feels_like')} style={{ cursor: 'pointer', opacity: activeDetail === 'feels_like' ? 1 : 0.5 }}>
                  <div style={{ fontSize: '2rem' }}>🌡️</div>
                  <small>Feels Like</small>
                </div>
                <div onClick={() => setActiveDetail('humidity')} style={{ cursor: 'pointer', opacity: activeDetail === 'humidity' ? 1 : 0.5 }}>
                  <div style={{ fontSize: '2rem' }}>💧</div>
                  <small>Humidity</small>
                </div>
                <div onClick={() => setActiveDetail('wind')} style={{ cursor: 'pointer', opacity: activeDetail === 'wind' ? 1 : 0.5 }}>
                  <div style={{ fontSize: '2rem' }}>💨</div>
                  <small>Wind Speed</small>
                </div>
              </div>

              <div style={{ marginTop: '20px', fontSize: '1.8rem', fontWeight: '600', color: '#3b82f6' }}>
                {activeDetail === 'feels_like' && displayTemp(weather.main.feels_like)}
                {activeDetail === 'humidity' && `${weather.main.humidity}%`}
                {activeDetail === 'wind' && `${weather.wind.speed} m/s`}
              </div>
            </>
          )}
        </div>

        {/* Forecast Section */}
        {forecast.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px', gap: '15px' }}>
            {forecast.map((day, idx) => (
              <div key={idx} style={{ ...glassStyle, flex: 1, padding: '20px', borderRadius: '20px', textAlign: 'center', color: '#fff' }}>
                <p style={{ margin: '0', fontWeight: 'bold', color: '#94a3b8' }}>{getDayName(day.dt_txt)}</p>
                <h3 style={{ margin: '10px 0' }}>{displayTemp(day.main.temp)}</h3>
                <small>{day.weather[0].main}</small>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;