import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSun,
  faCloud,
  faCloudRain,
  faTint,
  faWind,
  faLightbulb
} from '@fortawesome/free-solid-svg-icons';
import './Weather.css';

const Weather = () => {
  // Mock weather data for Igbaja
  const currentWeather = {
    location: 'Igbaja',
    temperature: 28,
    condition: 'Sunny',
    icon: '☀️',
    humidity: 65,
    wind: 12,
    sunrise: '6:30 AM',
    sunset: '6:45 PM'
  };

  const forecast = [
    {
      day: 'Today',
      icon: '☀️',
      condition: 'Sunny',
      high: 32,
      low: 22,
      rain: null
    },
    {
      day: 'Tomorrow',
      icon: '⛅',
      condition: 'Cloudy',
      high: 30,
      low: 21,
      rain: null
    },
    {
      day: 'Wednesday',
      icon: '🌧️',
      condition: 'Rainy',
      high: 28,
      low: 20,
      rain: '15mm rain'
    },
    {
      day: 'Thursday',
      icon: '☁️',
      condition: 'Cloudy',
      high: 29,
      low: 21,
      rain: '5mm rain'
    },
    {
      day: 'Friday',
      icon: '☀️',
      condition: 'Sunny',
      high: 31,
      low: 23,
      rain: null
    },
    {
      day: 'Saturday',
      icon: '☀️',
      condition: 'Sunny',
      high: 33,
      low: 24,
      rain: null
    },
    {
      day: 'Sunday',
      icon: '🌧️',
      condition: 'Rainy',
      high: 29,
      low: 22,
      rain: '20mm rain'
    }
  ];

  const farmingTips = [
    {
      tip: 'Perfect weather for planting yam and cassava this week',
      icon: '🌱',
      priority: 'high'
    },
    {
      tip: 'Expected rainfall Wednesday - good time for transplanting',
      icon: '🌧️',
      priority: 'medium'
    },
    {
      tip: 'High humidity levels - watch for fungal diseases in crops',
      icon: '🍄',
      priority: 'medium'
    },
    {
      tip: 'Sunny weekend ahead - ideal for harvesting and drying',
      icon: '☀️',
      priority: 'low'
    }
  ];

  return (
    <div className="weather-page">
      {/* Current Weather Section */}
      <div className="current-weather">
        <div className="weather-header">
          <div className="weather-title">
            <h1>☁️ Current Weather - Igbaja</h1>
            <p>Real-time weather conditions for better farming decisions</p>
          </div>
        </div>

        <div className="weather-main">
          <div className="temperature-section">
            <div className="temp-icon">
              <span className="weather-emoji">{currentWeather.icon}</span>
            </div>
            <div className="temp-info">
              <div className="temp-value">{currentWeather.temperature}°C</div>
              <div className="temp-condition">{currentWeather.condition}</div>
            </div>
          </div>

          <div className="weather-stats">
            <div className="stat-item">
              <div className="stat-icon humidity">
                <FontAwesomeIcon icon={faTint} />
              </div>
              <div className="stat-info">
                <div className="stat-label">Humidity</div>
                <div className="stat-value">{currentWeather.humidity}%</div>
              </div>
            </div>

            <div className="stat-item">
              <div className="stat-icon wind">
                <FontAwesomeIcon icon={faWind} />
              </div>
              <div className="stat-info">
                <div className="stat-label">Wind</div>
                <div className="stat-value">{currentWeather.wind} km/h</div>
              </div>
            </div>

            <div className="stat-item">
              <div className="stat-icon sunrise">
                <FontAwesomeIcon icon={faSun} />
              </div>
              <div className="stat-info">
                <div className="stat-label">Sunrise</div>
                <div className="stat-value">{currentWeather.sunrise}</div>
              </div>
            </div>

            <div className="stat-item">
              <div className="stat-icon sunset">
                <FontAwesomeIcon icon={faSun} />
              </div>
              <div className="stat-info">
                <div className="stat-label">Sunset</div>
                <div className="stat-value">{currentWeather.sunset}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 7-Day Forecast */}
      <div className="forecast-section">
        <h2>7-Day Forecast</h2>
        <p>Plan your farming activities with our extended forecast</p>
        
        <div className="forecast-grid">
          {forecast.map((day, index) => (
            <div key={index} className="forecast-card">
              <div className="forecast-day">{day.day}</div>
              <div className="forecast-icon">
                <span className="forecast-emoji">{day.icon}</span>
              </div>
              <div className="forecast-condition">{day.condition}</div>
              <div className="forecast-temp">
                <span className="temp-high">{day.high}°</span>
                <span className="temp-separator">/</span>
                <span className="temp-low">{day.low}°</span>
              </div>
              {day.rain && (
                <div className="forecast-rain">{day.rain}</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Weather-Based Farming Tips */}
      <div className="farming-tips-section">
        <h2>Weather-Based Farming Tips</h2>
        <div className="tips-grid">
          {farmingTips.map((item, index) => (
            <div key={index} className={`tip-card priority-${item.priority}`}>
              <div className="tip-icon">
                <span>{item.icon}</span>
              </div>
              <div className="tip-content">
                <p>{item.tip}</p>
                <div className="tip-priority">
                  <FontAwesomeIcon icon={faLightbulb} />
                  <span className="priority-text">{item.priority} priority</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Weather;