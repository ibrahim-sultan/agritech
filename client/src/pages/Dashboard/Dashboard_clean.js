import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUsers,
  faTrendingUp,
  faExclamationTriangle,
  faGraduationCap,
  faShieldAlt,
  faArrowUp,
  faArrowDown,
  faMinus,
  faMapMarkerAlt,
  faClock
} from '@fortawesome/free-solid-svg-icons';
import './Dashboard_new.css';

const Dashboard = () => {
  const [loading, setLoading] = useState(false);

  // Mock crop prices data
  const mockCropPrices = [
    {
      name: 'Yam',
      nameYoruba: 'Isu',
      price: 2500,
      unit: 'per tuber',
      previousPrice: 2300,
      market: 'Igbaja Central Market',
      lastUpdated: '2 hours ago',
      trend: 'up'
    },
    {
      name: 'Cassava',
      nameYoruba: 'Ege',
      price: 800,
      unit: 'per bag',
      previousPrice: 850,
      market: 'Igbaja Central Market',
      lastUpdated: '1 hour ago',
      trend: 'down'
    },
    {
      name: 'Maize',
      nameYoruba: 'Agbado',
      price: 1200,
      unit: 'per bag',
      previousPrice: 1200,
      market: 'Ilorin Regional Market',
      lastUpdated: '3 hours ago',
      trend: 'stable'
    },
    {
      name: 'Tomatoes',
      nameYoruba: 'Tomati',
      price: 3500,
      unit: 'per basket',
      previousPrice: 3200,
      market: 'Igbaja Central Market',
      lastUpdated: '30 minutes ago',
      trend: 'up'
    },
    {
      name: 'Beans',
      nameYoruba: 'Ewa',
      price: 1800,
      unit: 'per bag',
      previousPrice: 1900,
      market: 'Ilorin Regional Market',
      lastUpdated: '1 hour ago',
      trend: 'down'
    },
    {
      name: 'Pepper',
      nameYoruba: 'Ata',
      price: 2200,
      unit: 'per basket',
      previousPrice: 2100,
      market: 'Igbaja Central Market',
      lastUpdated: '45 minutes ago',
      trend: 'up'
    }
  ];

  // Stats cards data
  const statsCards = [
    {
      title: 'Active Users',
      value: '1,247',
      change: '+12% this week',
      icon: faUsers,
      color: '#3b82f6'
    },
    {
      title: 'Crop Price Updates',
      value: '156',
      change: 'Updated today',
      icon: faTrendingUp,
      color: '#10b981'
    },
    {
      title: 'Weather Alerts',
      value: '3',
      change: 'Active alerts',
      icon: faExclamationTriangle,
      color: '#f59e0b'
    },
    {
      title: 'Training Completed',
      value: '89',
      change: '+23 this month',
      icon: faGraduationCap,
      color: '#8b5cf6'
    },
    {
      title: 'Farming Tips',
      value: '45',
      change: '5 new this week',
      icon: faTrendingUp,
      color: '#6366f1'
    },
    {
      title: 'Security Reports',
      value: '7',
      change: '2 resolved',
      icon: faShieldAlt,
      color: '#ef4444'
    }
  ];

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'up':
        return <FontAwesomeIcon icon={faArrowUp} className="trend-up" />;
      case 'down':
        return <FontAwesomeIcon icon={faArrowDown} className="trend-down" />;
      default:
        return <FontAwesomeIcon icon={faMinus} className="trend-stable" />;
    }
  };

  if (loading) {
    return (
      <div className="modern-dashboard loading">
        <div className="loading-spinner">Loading...</div>
        <p>Loading Igbaja AgriTech...</p>
      </div>
    );
  }

  return (
    <div className="modern-dashboard">
      {/* Header Section */}
      <div className="dashboard-header">
        <div className="dashboard-title">
          <div className="app-logo">
            <div className="logo-icon">🌱</div>
            <div className="logo-text">
              <h1>Igbaja AgriTech</h1>
              <p>📍 Igbaja Community Dashboard</p>
            </div>
          </div>
          <div className="active-users">
            <span className="users-icon">👥</span>
            <span className="users-count">1,247 Active Users</span>
          </div>
        </div>
        
        <div className="welcome-banner">
          <div className="banner-content">
            <h2>Kaabo si Igbaja AgriTech! 👋</h2>
            <p>Welcome to your farming companion. Get real-time crop prices, weather updates, and learn new skills.</p>
            <div className="banner-meta">
              <span>📅 12/08/2025</span>
              <span>📱 Mobile Optimized</span>
            </div>
          </div>
          <div className="banner-visual">
            <div className="growth-icon">📈</div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        {statsCards.map((card, index) => (
          <div key={index} className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: card.color }}>
              <FontAwesomeIcon icon={card.icon} />
            </div>
            <div className="stat-content">
              <h3>{card.value}</h3>
              <p>{card.title}</p>
              <span className="stat-change">{card.change}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="content-grid">
        {/* Crop Prices Section */}
        <div className="crop-prices-section">
          <div className="crop-prices-grid">
            {mockCropPrices.map((crop, index) => (
              <div key={index} className="crop-price-card">
                <div className="crop-header">
                  <div className="crop-info">
                    <h3>{crop.name}</h3>
                    <p className="crop-yoruba">{crop.nameYoruba}</p>
                  </div>
                  <div className="trend-indicator">
                    {getTrendIcon(crop.trend)}
                  </div>
                </div>
                
                <div className="price-info">
                  <div className="current-price">
                    <span className="currency">₦</span>
                    <span className="amount">{crop.price.toLocaleString()}</span>
                  </div>
                  <p className="unit">{crop.unit}</p>
                </div>
                
                <div className="price-comparison">
                  <span className="previous-label">Previous:</span>
                  <span className={`previous-price ${crop.trend === 'up' ? 'lower' : crop.trend === 'down' ? 'higher' : 'same'}`}>
                    ₦{crop.previousPrice.toLocaleString()}
                  </span>
                </div>
                
                <div className="market-info">
                  <div className="location">
                    <FontAwesomeIcon icon={faMapMarkerAlt} />
                    <span>{crop.market}</span>
                  </div>
                  <div className="timestamp">
                    <FontAwesomeIcon icon={faClock} />
                    <span>Updated {crop.lastUpdated}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="navigation-tabs">
        <div className="nav-tab active">
          <FontAwesomeIcon icon={faTrendingUp} />
          <span>Crop Prices</span>
        </div>
        <div className="nav-tab">
          <span>☁️</span>
          <span>Weather</span>
        </div>
        <div className="nav-tab">
          <FontAwesomeIcon icon={faGraduationCap} />
          <span>Farm Tips</span>
        </div>
        <div className="nav-tab">
          <span>💻</span>
          <span>Training</span>
        </div>
        <div className="nav-tab">
          <FontAwesomeIcon icon={faShieldAlt} />
          <span>Security</span>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
