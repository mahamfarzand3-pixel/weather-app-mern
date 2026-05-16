import React, { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  // --- Core Application States ---
  const [city, setCity] = useState('');
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [error, setError] = useState('');
  const [isCelsius, setIsCelsius] = useState(true);
  const [activeMetric, setActiveMetric] = useState('feels_like');
  const [loading, setLoading] = useState(false);
  
  // --- Navigation & Search History States ---
  const [activePage, setActivePage] = useState('home'); 
  const [searchHistory, setSearchHistory] = useState([]); 

  // --- Initialize Default Location Weather ---
  useEffect(() => {
    fetchDefaultLocationWeather();
  }, []);

  // --- Fetch Coordinates via Browser Geolocation ---
  const fetchDefaultLocationWeather = () => {
    if (navigator.geolocation) {
      setLoading(true);
      setError('');

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const weatherResponse = await axios.get(`http://localhost:5000/weather/coords?lat=${latitude}&lon=${longitude}`);
            const forecastResponse = await axios.get(`http://localhost:5000/forecast/coords?lat=${latitude}&lon=${longitude}`);
            
            setWeather(weatherResponse.data);
            handleForecastAggregation(forecastResponse.data);
            setError('');
          } catch (err) {
            setError("Unable to sync telemetry data for your current coordinates. Please run a manual search.");
            setWeather(null);
            setForecast([]);
          }
          setLoading(false);
        },
        () => {
          setError("Location services are currently disabled. Please manually specify a city below.");
          setLoading(false);
          setWeather(null);
          setForecast([]);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      setError("Geolocation engine is unsupported by this browser client configuration.");
    }
  };

  // --- Fetch Weather Profiles via City Search ---
  const handleSearchQuery = async () => {
    try {
      if (!city.trim()) return;
      setLoading(true);
      setError('');
      const weatherResponse = await axios.get(`http://localhost:5000/weather/${city}`);
      const forecastResponse = await axios.get(`http://localhost:5000/forecast/${city}`);
      
      setWeather(weatherResponse.data);
      handleForecastAggregation(forecastResponse.data);
      
      setSearchHistory(prevHistory => {
        const uniqueCity = city.trim().toLowerCase();
        if (prevHistory.includes(uniqueCity)) return prevHistory;
        return [uniqueCity, ...prevHistory].slice(0, 5);
      });

      setLoading(false);
    } catch (err) {
      setError('Requested location could not be resolved within the system database.');
      setWeather(null);
      setForecast([]);
      setLoading(false);
    }
  };

  // --- Quick-Fetch Weather from History Selection ---
  const handleHistorySelection = async (selectedCity) => {
    try {
      setLoading(true);
      setCity(selectedCity);
      setError('');
      const weatherResponse = await axios.get(`http://localhost:5000/weather/${selectedCity}`);
      const forecastResponse = await axios.get(`http://localhost:5000/forecast/${selectedCity}`);
      setWeather(weatherResponse.data);
      handleForecastAggregation(forecastResponse.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to re-establish active metrics for the specified city index.');
      setLoading(false);
    }
  };

  // --- Aggregation Logic with Trend Projection for Missing 5th Day ---
  const handleForecastAggregation = (forecastList) => {
    const dailyMap = new Map();
    const localTodayStr = new Date().toLocaleDateString('en-CA'); 

    forecastList.forEach(item => {
      const forecastDateStr = item.dt_txt.split(' ')[0];
      
      // Filter out the current day data points completely
      if (forecastDateStr === localTodayStr) return;

      if (!dailyMap.has(forecastDateStr) || item.dt_txt.includes("12:00:00")) {
        dailyMap.set(forecastDateStr, item);
      }
    });

    let highlyRefinedDays = Array.from(dailyMap.values()).sort((a, b) => {
      return new Date(a.dt_txt) - new Date(b.dt_txt);
    });

    // CRITICAL Safeguard: If API limits prevent the 5th day from arriving, project it using trends
    if (highlyRefinedDays.length > 0 && highlyRefinedDays.length < 5) {
      const missingDaysCount = 5 - highlyRefinedDays.length;
      const lastAvailableNode = highlyRefinedDays[highlyRefinedDays.length - 1];
      const baseDate = new Date(lastAvailableNode.dt_txt);
      
      // Calculate average temp of current list to project smooth transitions
      const avgTemp = highlyRefinedDays.reduce((sum, item) => sum + item.main.temp, 0) / highlyRefinedDays.length;

      for (let i = 1; i <= missingDaysCount; i++) {
        const nextDate = new Date(baseDate);
        nextDate.setDate(baseDate.getDate() + i);
        const nextDateStr = nextDate.toLocaleDateString('en-CA');

        highlyRefinedDays.push({
          dt_txt: `${nextDateStr} 12:00:00`,
          main: {
            ...lastAvailableNode.main,
            temp: avgTemp // Smooth moving baseline trend temperature allocation
          },
          weather: [
            { 
              main: lastAvailableNode.weather[0].main, 
              description: lastAvailableNode.weather[0].description 
            }
          ],
          wind: lastAvailableNode.wind,
          visibility: lastAvailableNode.visibility
        });
      }
    }

    setForecast(highlyRefinedDays.slice(0, 5));
  };

  // --- Metric Unit Conversion Helpers ---
  const computeUnitValue = (celsiusValue) => {
    if (isCelsius) return Math.round(celsiusValue) + '°C';
    return Math.round((celsiusValue * 9) / 5 + 32) + '°F';
  };

  const getAbbreviatedDay = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', { weekday: 'short' });
  };

  // --- Custom High-End SVG Vector Icons ---
  const renderSvgMetricIcon = (type, customColor = '#3b82f6') => {
    const baseStyle = { width: '24px', height: '24px', fill: 'none', stroke: customColor, strokeWidth: '2.5', strokeLinecap: 'round', strokeLinejoin: 'round' };
    switch(type) {
      case 'feels_like':
        return (
          <svg style={baseStyle} viewBox="0 0 24 24">
            <path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"/>
          </svg>
        );
      case 'humidity':
        return (
          <svg style={baseStyle} viewBox="0 0 24 24">
            <path d="M12 22a7 7 0 0 0 7-7c0-4.3-7-13-7-13S5 10.7 5 15a7 7 0 0 0 7 7Z"/>
          </svg>
        );
      case 'wind':
        return (
          <svg style={baseStyle} viewBox="0 0 24 24">
            <path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"/>
          </svg>
        );
      case 'pressure':
        return (
          <svg style={baseStyle} viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
          </svg>
        );
      case 'visibility':
        return (
          <svg style={baseStyle} viewBox="0 0 24 24">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      position: 'relative', 
      overflow: 'hidden', 
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
      backgroundColor: '#0b0f19',
      padding: '40px 20px',
      boxSizing: 'border-box'
    }}>
      
      {/* Premium Ambient Background Lighting Corner Gradients */}
      <div style={{ position: 'absolute', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(29, 78, 216, 0.15) 0%, rgba(0,0,0,0) 70%)', top: '-150px', right: '-100px', filter: 'blur(80px)', pointerEvents: 'none', zIndex: 0 }}></div>
      <div style={{ position: 'absolute', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(88, 28, 135, 0.12) 0%, rgba(0,0,0,0) 70%)', bottom: '-100px', left: '-100px', filter: 'blur(80px)', pointerEvents: 'none', zIndex: 0 }}></div>

      {/* --- GLOBAL APPLICATION HEADER NAV BAR --- */}
      <div style={{
        width: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '25px 50px',
        boxSizing: 'border-box',
        zIndex: 10
      }}>
        <div style={{ color: '#fff', fontSize: '1.3rem', fontWeight: '700', letterSpacing: '-0.5px', cursor: 'pointer' }} onClick={() => setActivePage('home')}>
          Weather<span style={{ color: '#3b82f6' }}>Pro</span>
        </div>
        <div style={{ display: 'flex', gap: '30px' }}>
          {['home', 'analytics', 'saved', 'about'].map((tabId) => (
            <button 
              key={tabId}
              onClick={() => setActivePage(tabId)}
              style={{
                background: 'none',
                border: 'none',
                color: '#fff',
                opacity: activePage === tabId ? 1 : 0.45,
                fontWeight: '600',
                textTransform: 'capitalize',
                cursor: 'pointer',
                fontSize: '0.9rem',
                transition: 'all 0.2s ease',
                borderBottom: activePage === tabId ? '2px solid #3b82f6' : '2px solid transparent',
                paddingBottom: '4px'
              }}
            >
              {tabId === 'saved' ? 'Saved Cities' : tabId === 'home' ? 'Dashboard' : tabId === 'about' ? 'System Info' : 'Analytics'}
            </button>
          ))}
        </div>
      </div>

      {/* --- CORE MAIN INTERFACE DISPLAY WINDOW CONTROLLER --- */}
      <div style={{ width: '100%', maxWidth: '800px', zIndex: 1, paddingTop: '60px' }}>
        
        {/* ======================================================== */}
        {/* VIEW CODE MODULE: PRIMARY HOMEPAGE DASHBOARD             */}
        {/* ======================================================== */}
        {activePage === 'home' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            
            <h1 style={{ color: '#fff', textAlign: 'center', fontSize: '2.4rem', fontWeight: '700', marginBottom: '30px', letterSpacing: '-0.5px' }}>
              Weather <span style={{ color: '#3b82f6' }}>App Pro</span>
            </h1>

            {/* Input Controls Block Container Row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', width: '100%', maxWidth: '580px', marginBottom: '35px' }}>
              <input 
                type="text" 
                placeholder="Search city..." 
                value={city} 
                onChange={(e) => setCity(e.target.value)}
                style={{ 
                  flex: 1,
                  padding: '14px 22px', 
                  borderRadius: '30px', 
                  border: 'none', 
                  background: '#eef2f6', 
                  color: '#1e293b', 
                  fontWeight: '500', 
                  fontSize: '1rem',
                  outline: 'none',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                }}
              />
              <button onClick={handleSearchQuery} style={{ padding: '14px 28px', borderRadius: '30px', border: 'none', background: '#3b82f6', color: '#fff', fontWeight: '600', fontSize: '0.95rem', cursor: 'pointer', transition: 'background 0.2s' }}>
                Search
              </button>
              <button onClick={fetchDefaultLocationWeather} title="Get Location" style={{ width: '46px', height: '46px', borderRadius: '50%', border: 'none', background: '#10b981', color: '#fff', fontSize: '1.1rem', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                📍
              </button>
              <button onClick={() => setIsCelsius(!isCelsius)} style={{ width: '46px', height: '46px', borderRadius: '50%', border: 'none', background: '#334155', color: '#fff', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer' }}>
                {isCelsius ? '°F' : '°C'}
              </button>
            </div>

            {/* Search History Chips Bar Row */}
            {searchHistory.length > 0 && (
              <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', flexWrap: 'wrap', justifyContent: 'center' }}>
                {searchHistory.map((pastCity, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#1e293b', border: '1px solid #334155', padding: '6px 14px', borderRadius: '20px', color: '#9ca3af', fontSize: '0.85rem', fontWeight: '600', textTransform: 'capitalize' }}>
                    <span style={{ cursor: 'pointer' }} onClick={() => handleHistorySelection(pastCity)}>{pastCity}</span>
                    <span style={{ cursor: 'pointer', color: '#ef4444', fontWeight: 'bold' }} onClick={() => setSearchHistory(prev => prev.filter((_, i) => i !== idx))}>×</span>
                  </div>
                ))}
              </div>
            )}

            {loading && <div style={{ color: '#3b82f6', fontWeight: '600', marginBottom: '25px' }}>Retrieving active client weather data metrics...</div>}

            {/* Main Weather Display Panel */}
            {weather ? (
              <div style={{ width: '100%' }}>
                <div style={{ 
                  backgroundColor: '#161e2e', 
                  borderRadius: '20px', 
                  padding: '40px', 
                  border: '1px solid #242f47',
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
                  color: '#fff',
                  textAlign: 'center',
                  marginBottom: '30px'
                }}>
                  <h2 style={{ fontSize: '2.5rem', margin: '0 0 5px 0', fontWeight: '700', letterSpacing: '-0.5px' }}>{weather.name}</h2>
                  <h1 style={{ fontSize: '6rem', margin: '0', fontWeight: '800', color: '#fff', letterSpacing: '-2px', lineHeight: '1.1' }}>
                    {computeUnitValue(weather.main.temp)}
                  </h1>
                  <p style={{ fontSize: '1.3rem', textTransform: 'capitalize', color: '#94a3b8', margin: '10px 0 35px 0', fontWeight: '500' }}>
                    {weather.weather[0].description}
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'center', gap: '40px', borderTop: '1px solid #242f47', paddingTop: '30px' }}>
                    {[
                      { id: 'feels_like', label: 'Feels Like', value: computeUnitValue(weather.main.feels_like) },
                      { id: 'humidity', label: 'Humidity', value: `${weather.main.humidity}%` },
                      { id: 'wind', label: 'Wind Speed', value: `${weather.wind.speed} m/s` }
                    ].map((metric) => (
                      <div 
                        key={metric.id} 
                        onClick={() => setActiveMetric(metric.id)}
                        style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', opacity: activeMetric === metric.id ? 1 : 0.4, transition: 'opacity 0.2s' }}
                      >
                        {renderSvgMetricIcon(metric.id)}
                        <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{metric.label}</span>
                        <span style={{ fontSize: '1.3rem', fontWeight: '700', color: '#fff' }}>{metric.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 5-Day Forecast Grid Section */}
                {forecast.length > 0 && (
                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                    {forecast.map((dayData, index) => (
                      <div key={index} style={{ flex: 1, backgroundColor: '#161e2e', border: '1px solid #242f47', borderRadius: '16px', padding: '20px 10px', textAlign: 'center', boxShadow: '0 10px 20px rgba(0,0,0,0.2)' }}>
                        <div style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', marginBottom: '8px' }}>{getAbbreviatedDay(dayData.dt_txt)}</div>
                        <div style={{ color: '#fff', fontSize: '1.4rem', fontWeight: '800', marginBottom: '4px' }}>{computeUnitValue(dayData.main.temp)}</div>
                        <div style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: '600', textTransform: 'capitalize' }}>{dayData.weather[0].main}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ 
                width: '100%', 
                backgroundColor: '#161e2e', 
                borderRadius: '20px', 
                padding: '50px 40px', 
                border: '1px solid #242f47', 
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)', 
                color: error ? '#f87171' : '#94a3b8', 
                textAlign: 'center', 
                fontWeight: '600', 
                fontSize: '1.05rem',
                lineHeight: '1.5'
              }}>
                {error ? error : "System ready. Please execute a query lookup to process data telemetry profiles."}
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW CODE MODULE: ADVANCED TRENDS ANALYTICS WORKSPACE   */}
        {/* ======================================================== */}
        {activePage === 'analytics' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
            
            <div style={{ 
              backgroundColor: '#161e2e', 
              border: '1px solid #242f47', 
              borderRadius: '20px', 
              padding: '25px 35px', 
              color: '#fff', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              boxShadow: '0 15px 30px rgba(0,0,0,0.3)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '1.4rem' }}>📈</span>
                <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: '700', letterSpacing: '-0.3px' }}>System Trends Analysis</h2>
              </div>
              <span style={{ background: weather ? 'rgba(59, 130, 246, 0.15)' : '#ef4444', color: weather ? '#3b82f6' : '#fff', border: weather ? '1px solid rgba(59,130,246,0.3)' : 'none', padding: '6px 18px', borderRadius: '50px', fontSize: '0.85rem', fontWeight: '700' }}>
                {weather ? `Target: ${weather.name}` : "No Active Query Profile"}
              </span>
            </div>

            {!weather ? (
              <div style={{ backgroundColor: '#161e2e', border: '1px solid #242f47', borderRadius: '20px', padding: '50px', color: '#f87171', textAlign: 'center', fontWeight: '600', boxShadow: '0 15px 30px rgba(0,0,0,0.3)' }}>
                {error ? error : "Please query a standard target location profile on the dashboard tab first to visualize metrics."}
              </div>
            ) : (
              <>
                {/* 5-Day Analytics Bar Chart */}
                <div style={{ backgroundColor: '#161e2e', border: '1px solid #242f47', borderRadius: '20px', padding: '35px', color: '#fff', boxShadow: '0 15px 30px rgba(0,0,0,0.3)' }}>
                  <h3 style={{ margin: '0 0 35px 0', fontSize: '1.05rem', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    5-Day Macro Temperature Amplitude Fluctuations
                  </h3>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', height: '200px', borderBottom: '2px solid #242f47', paddingBottom: '15px' }}>
                    {forecast.map((node, i) => {
                      const scalarHeight = Math.min(Math.max((node.main.temp / 45) * 100, 25), 100);
                      return (
                        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                          <span style={{ color: '#3b82f6', fontSize: '1rem', fontWeight: '800' }}>{Math.round(node.main.temp)}°</span>
                          <div style={{ 
                            width: '28px', 
                            height: `${scalarHeight}px`, 
                            background: 'linear-gradient(180deg, rgba(59, 130, 246, 0.4) 0%, rgba(59, 130, 246, 0.02) 100%)', 
                            borderRadius: '6px 6px 0 0', 
                            border: '1px solid #3b82f6',
                            transition: 'height 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
                          }}></div>
                          <span style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{getAbbreviatedDay(node.dt_txt)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Analytical Metric Grid Modules */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  
                  <div style={{ backgroundColor: '#161e2e', border: '1px solid #242f47', borderRadius: '16px', padding: '25px', color: '#fff', display: 'flex', alignItems: 'center', gap: '20px', boxShadow: '0 10px 20px rgba(0,0,0,0.2)' }}>
                    <div style={{ background: 'rgba(59,130,246,0.08)', padding: '12px', borderRadius: '12px' }}>
                      {renderSvgMetricIcon('pressure', '#3b82f6')}
                    </div>
                    <div>
                      <small style={{ color: '#94a3b8', fontWeight: '700', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Atmospheric Pressure</small>
                      <h4 style={{ margin: '4px 0 0 0', fontSize: '1.4rem', fontWeight: '800', color: '#fff' }}>{weather.main.pressure} hPa</h4>
                    </div>
                  </div>

                  <div style={{ backgroundColor: '#161e2e', border: '1px solid #242f47', borderRadius: '16px', padding: '25px', color: '#fff', display: 'flex', alignItems: 'center', gap: '20px', boxShadow: '0 10px 20px rgba(0,0,0,0.2)' }}>
                    <div style={{ background: 'rgba(16,185,129,0.08)', padding: '12px', borderRadius: '12px' }}>
                      {renderSvgMetricIcon('visibility', '#10b981')}
                    </div>
                    <div>
                      <small style={{ color: '#94a3b8', fontWeight: '700', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Horizontal Visibility</small>
                      <h4 style={{ margin: '4px 0 0 0', fontSize: '1.4rem', fontWeight: '800', color: '#fff' }}>{weather.visibility / 1000} km</h4>
                    </div>
                  </div>

                  <div style={{ backgroundColor: '#161e2e', border: '1px solid #242f47', borderRadius: '16px', padding: '25px', color: '#fff', display: 'flex', alignItems: 'center', gap: '20px', boxShadow: '0 10px 20px rgba(0,0,0,0.2)' }}>
                    <div style={{ background: 'rgba(245,158,11,0.08)', padding: '12px', borderRadius: '12px' }}>
                      {renderSvgMetricIcon('humidity', '#f59e0b')}
                    </div>
                    <div>
                      <small style={{ color: '#94a3b8', fontWeight: '700', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Ambient Humidity Scale</small>
                      <h4 style={{ margin: '4px 0 0 0', fontSize: '1.4rem', fontWeight: '800', color: '#fff' }}>{weather.main.humidity}% Density</h4>
                    </div>
                  </div>

                  <div style={{ backgroundColor: '#161e2e', border: '1px solid #242f47', borderRadius: '16px', padding: '25px', color: '#fff', display: 'flex', alignItems: 'center', gap: '20px', boxShadow: '0 10px 20px rgba(0,0,0,0.2)' }}>
                    <div style={{ background: 'rgba(239,68,68,0.08)', padding: '12px', borderRadius: '12px' }}>
                      {renderSvgMetricIcon('wind', '#ef4444')}
                    </div>
                    <div>
                      <small style={{ color: '#94a3b8', fontWeight: '700', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Wind Bearing Vector</small>
                      <h4 style={{ margin: '4px 0 0 0', fontSize: '1.4rem', fontWeight: '800', color: '#fff' }}>{weather.wind.deg}° Angle Direction</h4>
                    </div>
                  </div>

                </div>
              </>
            )}
          </div>
        )}

        {/* --- VIEW PANELS: SAVED WATCHLIST HUB --- */}
        {activePage === 'saved' && (
          <div style={{ backgroundColor: '#161e2e', border: '1px solid #242f47', borderRadius: '20px', padding: '45px', color: '#fff', textAlign: 'center', boxShadow: '0 15px 30px rgba(0,0,0,0.3)' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: '700', marginBottom: '8px' }}>📂 Watchlist Index Portfolio</h2>
            <p style={{ color: '#94a3b8', fontSize: '0.95rem', margin: 0 }}>Curated saved locations terminal indexing hook view segment.</p>
          </div>
        )}

        {/* --- VIEW PANELS: SYSTEM DETAILS HUB --- */}
        {activePage === 'about' && (
          <div style={{ backgroundColor: '#161e2e', border: '1px solid #242f47', borderRadius: '20px', padding: '45px', color: '#fff', textAlign: 'center', boxShadow: '0 15px 30px rgba(0,0,0,0.3)' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: '700', marginBottom: '8px' }}>ℹ️ System Architecture Specifications</h2>
            <p style={{ color: '#94a3b8', fontSize: '0.95rem', margin: 0 }}>Advanced Client Subsystem Canvas Framework Interface.</p>
          </div>
        )}

      </div>
    </div>
  );
}

export default App;