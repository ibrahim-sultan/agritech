import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faMoneyBillWave, 
  faGraduationCap, 
  faLightbulb, 
  faShieldAlt,
  faThermometerHalf,
  faTint,
  faLeaf,
  faSeedling,
  faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import './Dashboard.css';

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    cropPrices: [],
    farmingTips: [],
    youthTraining: [],
    securityStats: { overview: { total: 0 } },
    weatherData: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchIgbajaData = async () => {
      try {
        setLoading(true);
        
        // Simplified data fetching with better error handling
        let cropPrices = [];
        let farmingTips = [];
        let youthTraining = [];
        let securityStats = { overview: { total: 0 } };
        let weatherData = null;

        try {
          const cropResponse = await axios.get('/api/crop-prices/featured');
          cropPrices = cropResponse.data || [];
        } catch (error) {
          console.log('Crop prices not available');
        }

        try {
          const tipsResponse = await axios.get('/api/farming-tips/featured');
          farmingTips = tipsResponse.data || [];
        } catch (error) {
          console.log('Farming tips not available');
        }

        try {
          const trainingResponse = await axios.get('/api/youth-training/featured');
          youthTraining = trainingResponse.data || [];
        } catch (error) {
          console.log('Youth training not available');
        }

        try {
          const securityResponse = await axios.get('/api/security-reports/stats');
          securityStats = securityResponse.data || { overview: { total: 0 } };
        } catch (error) {
          console.log('Security stats not available');
        }

        try {
          const weatherResponse = await axios.get('/api/weather?limit=1');
          weatherData = weatherResponse.data && weatherResponse.data.length > 0 ? weatherResponse.data[0] : null;
        } catch (error) {
          console.log('Weather data not available');
        }
        
        setDashboardData({
          cropPrices,
          farmingTips,
          youthTraining,
          securityStats,
          weatherData
        });
      } catch (error) {
        console.error('Error fetching Igbaja dashboard data:', error);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchIgbajaData();
  }, []);

  const overviewCards = [
    {
      title: 'Market Updates',
      value: dashboardData.cropPrices?.length || 0,
      icon: faMoneyBillWave,
      color: '#22c55e',
      change: '+5%'
    },
    {
      title: 'Farming Tips',
      value: dashboardData.farmingTips?.length || 0,
      icon: faLightbulb,
      color: '#84cc16',
      change: '+2'
    },
    {
      title: 'Training Courses',
      value: dashboardData.youthTraining?.length || 0,
      icon: faGraduationCap,
      color: '#8b5cf6',
      change: '+1'
    },
    {
      title: 'Security Reports',
      value: dashboardData.securityStats?.overview?.total || 0,
      icon: faShieldAlt,
      color: '#ef4444',
      change: '-1'
    }
  ];

  const sensorCards = [
    {
      title: 'Temperature',
      value: dashboardData.weatherData?.temperature?.current || 28,
      unit: '°C',
      icon: faThermometerHalf,
      color: '#f59e0b'
    },
    {
      title: 'Humidity',
      value: dashboardData.weatherData?.humidity || 65,
      unit: '%',
      icon: faTint,
      color: '#06b6d4'
    },
    {
      title: 'Available Tips',
      value: dashboardData.farmingTips?.length || 0,
      unit: '',
      icon: faLeaf,
      color: '#22c55e'
    }
  ];

  if (loading) {
    return (
      <div className="dashboard dashboard--loading">
        <div className="loading-spinner animate-spin">⏳</div>
        <p>Loading Igbaja AgriTech Dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard">
        <div className="dashboard__header">
          <h1>🌱 Igbaja AgriTech Dashboard</h1>
          <p className="dashboard__subtitle">
            Empowering Rural Youth in Igbaja, Kwara State
          </p>
        </div>
        <div className="dashboard__error">
          <p>⚠️ {error}</p>
          <p>Please ensure the backend server is running on port 5000</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard__header">
        <h1>🌱 Igbaja AgriTech Dashboard</h1>
        <p className="dashboard__subtitle">
          Empowering Rural Youth in Igbaja, Kwara State
        </p>
      </div>

      <div className="dashboard__overview">
        {overviewCards.map((card, index) => (
          <div key={index} className="dashboard__card">
            <div className="dashboard__card-icon" style={{ color: card.color }}>
              <FontAwesomeIcon icon={card.icon} />
            </div>
            <div className="dashboard__card-content">
              <h3>{card.value}</h3>
              <p>{card.title}</p>
              <span className={`dashboard__card-change ${card.change.startsWith('+') ? 'positive' : 'negative'}`}>
                {card.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard__grid">
        <div className="dashboard__sensors">
          <h2>🌤️ Current Conditions</h2>
          <div className="dashboard__sensor-grid">
            {sensorCards.map((sensor, index) => (
              <div key={index} className="dashboard__sensor-card">
                <div className="dashboard__sensor-icon" style={{ color: sensor.color }}>
                  <FontAwesomeIcon icon={sensor.icon} />
                </div>
                <div className="dashboard__sensor-data">
                  <span className="dashboard__sensor-value">
                    {sensor.value}{sensor.unit}
                  </span>
                  <span className="dashboard__sensor-label">{sensor.title}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="dashboard__alerts">
          <h2>💰 Latest Crop Prices</h2>
          <div className="dashboard__activity-list">
            {dashboardData.cropPrices.slice(0, 3).map((crop, index) => (
              <div key={index} className="dashboard__activity-item">
                <div className="dashboard__activity-icon success">
                  <FontAwesomeIcon icon={faMoneyBillWave} />
                </div>
                <div className="dashboard__activity-content">
                  <p>{crop.cropName} ({crop.cropNameYoruba}): ₦{crop.pricePerUnit.value} {crop.pricePerUnit.unit}</p>
                  <span>{crop.market.name}</span>
                </div>
              </div>
            ))}
            {dashboardData.cropPrices.length === 0 && (
              <div className="dashboard__activity-item">
                <div className="dashboard__activity-icon info">
                  <FontAwesomeIcon icon={faMoneyBillWave} />
                </div>
                <div className="dashboard__activity-content">
                  <p>Crop prices will appear here once data is loaded</p>
                  <span>Igbaja Local Market</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="dashboard__weather">
          <h2>🎓 Youth Training</h2>
          <div className="dashboard__weather-current">
            <div className="dashboard__stats-list">
              {dashboardData.youthTraining.slice(0, 3).map((course, index) => (
                <div key={index} className="dashboard__stat">
                  <span className="dashboard__stat-label">{course.title.english}</span>
                  <span className="dashboard__stat-value">{course.level}</span>
                </div>
              ))}
              {dashboardData.youthTraining.length === 0 && (
                <div className="dashboard__stat">
                  <span className="dashboard__stat-label">Free computer skills training</span>
                  <span className="dashboard__stat-value">Available</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="dashboard__quick-stats">
          <h2>🌾 Farming Tips</h2>
          <div className="dashboard__stats-list">
            {dashboardData.farmingTips.slice(0, 3).map((tip, index) => (
              <div key={index} className="dashboard__stat">
                <span className="dashboard__stat-label">{tip.title.english}</span>
                <span className="dashboard__stat-value">By {tip.author?.name || 'Expert'}</span>
              </div>
            ))}
            {dashboardData.farmingTips.length === 0 && (
              <div className="dashboard__stat">
                <span className="dashboard__stat-label">Organic pest control tips</span>
                <span className="dashboard__stat-value">Available</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="dashboard__footer">
        <p>🏡 Serving Igbaja Community | 🌍 Kwara State, Nigeria | 📱 Mobile Optimized</p>
      </div>
    </div>
  );
};

export default Dashboard;
