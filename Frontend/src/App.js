import React, { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  const [city, setCity] = useState('');
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [error, setError] = useState('');
  const [isCelsius, setIsCelsius] = useState(true);
  const [activeDetail, setActiveDetail] = useState('feels_like');
  const [loading, setLoading] = useState(false);

  // Fetch weather based on user's current GPS/Network location
  const getLocationWeather = () => {
    if (navigator.geolocation) {
      setLoading(true);
      setError('');

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const weatherRes = await axios.get(`http://localhost:5000/weather/coords?lat=${latitude}&lon=${longitude}`);
            const forecastRes = await axios.get(`http://localhost:5000/forecast/coords?lat=${latitude}&lon=${longitude}`);
            
            setWeather(weatherRes.data);
            processForecastData(forecastRes.data);
            setError('');
          } catch (err) {
            setError("Could not fetch weather for your exact coordinates. Please use the search bar!");
            setWeather(null);
            setForecast([]);
          }
          setLoading(false);
        },
        (geoError) => {
          setError("Location access denied or unavailable. Please type your city name manually!");
          setLoading(false);
          setWeather(null);
          setForecast([]);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      setError("Geolocation is not supported by this browser.");
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
          
          <button onClick={getLocationWeather} title="Get Current Location" style={{ padding: '15px', width: '55px', borderRadius: '50%', border: 'none', background: '#10b981', color: '#fff', fontSize: '1.2rem', cursor: 'pointer' }}>
            📍
          </button>

          <button onClick={() => setIsCelsius(!isCelsius)} style={{ padding: '15px', width: '55px', borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}>
            {isCelsius ? '°F' : '°C'}
          </button>
        </div>

        {loading && <p style={{ color: '#fff', textAlign: 'center' }}>Fetching data...</p>}

        {/* Main Weather Card Container */}
        <div style={{ ...glassStyle, borderRadius: '30px', padding: '40px', textAlign: 'center', color: '#fff', marginBottom: '30px' }}>
          {error && <h3 style={{ color: '#f87171', marginBottom: '10px' }}>{error}</h3>}
          
          {!weather && !error && (
            <div style={{ opacity: 0.8, padding: '20px' }}>
              <div style={{ fontSize: '80px', marginBottom: '20px' }}>🌤️</div>
              <h2>Welcome to Weather App Pro</h2>
              <p style={{ color: '#94a3b8' }}>Type your city name or click the location icon to start.</p>
            </div>
          )}

          {weather && (
            <>
              <h2 style={{ fontSize: '2.5rem', marginBottom: '10px', fontWeight: '700' }}>{weather.name}</h2>
              <h1 style={{ fontSize: '5.5rem', margin: '10px 0', fontWeight: 'bold' }}>{displayTemp(weather.main.temp)}</h1>
              <p style={{ fontSize: '1.4rem', textTransform: 'capitalize', color: '#94a3b8', marginBottom: '30px' }}>{weather.weather[0].description}</p>

              {/* Weather Extra Details Tabs */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '40px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '25px' }}>
                <div onClick={() => setActiveDetail('feels_like')} style={{ cursor: 'pointer', opacity: activeDetail === 'feels_like' ? 1 : 0.5, transition: '0.3s' }}>
                  <div style={{ fontSize: '2rem' }}>🌡️</div>
                  <small style={{ color: '#94a3b8', fontWeight: '600' }}>Feels Like</small>
                </div>
                <div onClick={() => setActiveDetail('humidity')} style={{ cursor: 'pointer', opacity: activeDetail === 'humidity' ? 1 : 0.5, transition: '0.3s' }}>
                  <div style={{ fontSize: '2rem' }}>💧</div>
                  <small style={{ color: '#94a3b8', fontWeight: '600' }}>Humidity</small>
                </div>
                <div onClick={() => setActiveDetail('wind')} style={{ cursor: 'pointer', opacity: activeDetail === 'wind' ? 1 : 0.5, transition: '0.3s' }}>
                  <div style={{ fontSize: '2rem' }}>💨</div>
                  <small style={{ color: '#94a3b8', fontWeight: '600' }}>Wind Speed</small>
                </div>
              </div>

              {/* Dynamic Content Display Area */}
              <div style={{ marginTop: '20px', fontSize: '1.8rem', fontWeight: '700', color: '#fff' }}>
                {activeDetail === 'feels_like' && displayTemp(weather.main.feels_like)}
                {activeDetail === 'humidity' && `${weather.main.humidity}%`}
                {activeDetail === 'wind' && `${weather.wind.speed} m/s`}
              </div>
            </>
          )}
        </div>

        {/* Forecast Section */}
        {forecast.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
            {forecast.map((day, idx) => (
              <div key={idx} style={{ ...glassStyle, flex: '1 1 120px', padding: '15px', borderRadius: '20px', textAlign: 'center', color: '#fff' }}>
                <p style={{ margin: '0', fontSize: '0.9rem', color: '#94a3b8', fontWeight: '600' }}>{getDayName(day.dt_txt)}</p>
                <h3 style={{ margin: '8px 0', fontSize: '1.4rem' }}>{displayTemp(day.main.temp)}</h3>
                <small style={{ textTransform: 'capitalize' }}>{day.weather[0].main}</small>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;