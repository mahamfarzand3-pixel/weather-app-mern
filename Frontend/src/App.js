import React, { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  const [city, setCity] = useState('');
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [error, setError] = useState('');
  const [isCelsius, setIsCelsius] = useState(true);
  const [activeDetail, setActiveDetail] = useState('feels_like');
  const [loading, setLoading] = useState(false); // Loading state for better UX

  // Feature: Auto-fetch location when app starts
  useEffect(() => {
    getLocationWeather();
  }, []);

  // Function to get current GPS location
  const getLocationWeather = () => {
    if (navigator.geolocation) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const weatherRes = await axios.get(`http://localhost:5000/weather/coords?lat=${latitude}&lon=${longitude}`);
          const forecastRes = await axios.get(`http://localhost:5000/forecast/coords?lat=${latitude}&lon=${longitude}`);
          
          setWeather(weatherRes.data);
          processForecastData(forecastRes.data);
          setError('');
        } catch (err) {
          setError("Couldn't fetch weather for your location.");
        }
        setLoading(false);
      }, () => {
        setError("Location permission denied.");
        setLoading(false);
      });
    } else {
      setError("Geolocation is not supported by your browser.");
    }
  };

  const getAllWeather = async () => {
    try {
      if (!city.trim()) return;
      setLoading(true);
      const weatherRes = await axios.get(`http://localhost:5000/weather/${city}`);
      const forecastRes = await axios.get(`http://localhost:5000/forecast/${city}`);
      setWeather(weatherRes.data);
      processForecastData(forecastRes.data);
      setError('');
      setLoading(false);
    } catch (err) {
      setError('City not found!');
      setWeather(null);
      setForecast([]);
      setLoading(false);
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

  const glassStyle = {
    background: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#0f172a', position: 'relative', overflow: 'hidden', fontFamily: "'Poppins', sans-serif" }}>
      
      {/* Background Glows */}
      <div style={{ position: 'absolute', width: '400px', height: '400px', background: '#3b82f6', borderRadius: '50%', top: '-100px', right: '-100px', filter: 'blur(80px)', opacity: 0.4 }}></div>
      <div style={{ position: 'absolute', width: '300px', height: '300px', background: '#9333ea', borderRadius: '50%', bottom: '-50px', left: '-50px', filter: 'blur(80px)', opacity: 0.3 }}></div>

      <div style={{ width: '90%', maxWidth: '900px', zIndex: 1, padding: '20px' }}>
        <h1 style={{ color: '#fff', textAlign: 'center', fontSize: '2.5rem', fontWeight: '800', marginBottom: '30px' }}>
          Weather <span style={{ color: '#3b82f6' }}>App Pro</span>
        </h1>

        {/* Search & Location Bar */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '40px', flexWrap: 'wrap' }}>
          <input 
            type="text" 
            placeholder="Search city..." 
            value={city} 
            onChange={(e) => setCity(e.target.value)}
            style={{ padding: '15px 25px', borderRadius: '50px', border: 'none', width: '250px', background: 'rgba(255,255,255,0.9)', outline: 'none' }}
          />
          <button onClick={getAllWeather} style={{ padding: '15px 25px', borderRadius: '50px', border: 'none', background: '#3b82f6', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}>
            Search
          </button>
          
          {/* NEW: Location Button */}
          <button onClick={getLocationWeather} title="Get Current Location" style={{ padding: '15px', width: '55px', borderRadius: '50%', border: 'none', background: '#10b981', color: '#fff', fontSize: '1.2rem', cursor: 'pointer' }}>
            📍
          </button>

          <button onClick={() => setIsCelsius(!isCelsius)} style={{ padding: '15px', width: '55px', borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}>
            {isCelsius ? '°F' : '°C'}
          </button>
        </div>

        {loading && <p style={{ color: '#fff', textAlign: 'center' }}>Fetching data...</p>}

        {/* Main Weather Card */}
        <div style={{ ...glassStyle, borderRadius: '30px', padding: '40px', textAlign: 'center', color: '#fff' }}>
          {error && <h3 style={{ color: '#f87171' }}>{error}</h3>}
          
          {weather && (
            <>
              <h2 style={{ fontSize: '2.2rem', marginBottom: '10px' }}>{weather.name}</h2>
              <h1 style={{ fontSize: '5rem', margin: '0', fontWeight: 'bold' }}>{displayTemp(weather.main.temp)}</h1>
              <p style={{ fontSize: '1.3rem', textTransform: 'capitalize', color: '#94a3b8' }}>{weather.weather[0].description}</p>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '30px', marginTop: '30px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}>
                <div onClick={() => setActiveDetail('feels_like')} style={{ cursor: 'pointer', opacity: activeDetail === 'feels_like' ? 1 : 0.5 }}>
                  <div style={{ fontSize: '1.8rem' }}>🌡️</div>
                  <small>Feels Like</small>
                </div>
                <div onClick={() => setActiveDetail('humidity')} style={{ cursor: 'pointer', opacity: activeDetail === 'humidity' ? 1 : 0.5 }}>
                  <div style={{ fontSize: '1.8rem' }}>💧</div>
                  <small>Humidity</small>
                </div>
                <div onClick={() => setActiveDetail('wind')} style={{ cursor: 'pointer', opacity: activeDetail === 'wind' ? 1 : 0.5 }}>
                  <div style={{ fontSize: '1.8rem' }}>💨</div>
                  <small>Wind Speed</small>
                </div>
              </div>

              <div style={{ marginTop: '15px', fontSize: '1.6rem', fontWeight: '600', color: '#fff' }}>
                {activeDetail === 'feels_like' && displayTemp(weather.main.feels_like)}
                {activeDetail === 'humidity' && `${weather.main.humidity}%`}
                {activeDetail === 'wind' && `${weather.wind.speed} m/s`}
              </div>
            </>
          )}
        </div>

        {/* Forecast Section */}
        {forecast.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px', gap: '10px', flexWrap: 'wrap' }}>
            {forecast.map((day, idx) => (
              <div key={idx} style={{ ...glassStyle, flex: '1 1 120px', padding: '15px', borderRadius: '20px', textAlign: 'center', color: '#fff' }}>
                <p style={{ margin: '0', fontSize: '0.9rem', color: '#94a3b8' }}>{getDayName(day.dt_txt)}</p>
                <h3 style={{ margin: '8px 0' }}>{displayTemp(day.main.temp)}</h3>
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