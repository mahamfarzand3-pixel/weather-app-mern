import React, { useState } from 'react';
import axios from 'axios';

function App() {
  const [city, setCity] = useState('');
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [error, setError] = useState('');
  
  // NEW STATE: To track if we are using Celsius (true) or Fahrenheit (false)
  const [isCelsius, setIsCelsius] = useState(true);

  const getAllWeather = async () => {
    try {
      if (!city.trim()) {
        setError('Please enter a city name');
        return;
      }

      const weatherRes = await axios.get(`http://localhost:5000/weather/${city}`);
      const forecastRes = await axios.get(`http://localhost:5000/forecast/${city}`);
      
      setWeather(weatherRes.data);
      
      // Process forecast data to get one midday entry per day
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

  /**
   * Helper function to convert temperature
   * Formula: (Celsius * 9/5) + 32 = Fahrenheit
   */
  const displayTemp = (temp) => {
    if (isCelsius) {
      return Math.round(temp) + '°C';
    } else {
      const fahrenheit = (temp * 9) / 5 + 32;
      return Math.round(fahrenheit) + '°F';
    }
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
      <h1>Weather App</h1>
      
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

        {/* UNIT SWITCHER BUTTON */}
        <button 
          onClick={() => setIsCelsius(!isCelsius)} 
          style={{ padding: '12px 15px', borderRadius: '25px', cursor: 'pointer', border: 'none', fontWeight: 'bold', backgroundColor: '#fff', color: '#333' }}
        >
          Switch to {isCelsius ? '°F' : '°C'}
        </button>
      </div>

      {error && <p style={{ color: '#ffeb3b', fontWeight: 'bold' }}>{error}</p>}

      {weather && (
        <div style={{ padding: '30px', borderRadius: '20px', backgroundColor: 'rgba(255, 255, 255, 0.2)', backdropFilter: 'blur(10px)', display: 'inline-block', marginBottom: '40px', minWidth: '320px' }}>
          <h2>{weather.name} (Today)</h2>
          {/* Temperature displayed using our conversion function */}
          <p style={{ fontSize: '60px', fontWeight: 'bold', margin: '10px 0' }}>
            {displayTemp(weather.main.temp)}
          </p>
          <p style={{ textTransform: 'capitalize', fontSize: '18px' }}>{weather.weather[0].description}</p>
        </div>
      )}

      {forecast.length > 0 && (
        <div>
          <h3>Next 5 Days Forecast</h3>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', padding: '20px', flexWrap: 'wrap' }}>
            {forecast.map((item, index) => (
              <div key={index} style={{ padding: '20px', backgroundColor: 'rgba(255, 255, 255, 0.15)', borderRadius: '15px', minWidth: '130px' }}>
                <p style={{ fontWeight: 'bold' }}>{getDayName(item.dt_txt)}</p>
                {/* Temperature displayed using our conversion function */}
                <p style={{ fontSize: '28px', fontWeight: 'bold' }}>
                  {displayTemp(item.main.temp)}
                </p>
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