import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUsers,
  faArrowTrendUp,
  faExclamationTriangle,
  faGraduationCap,
  faShieldAlt,
  faArrowUp,
  faArrowDown,
  faMinus,
  faMapMarkerAlt,
  faClock,
  faChartLine,
  faRefresh
} from '@fortawesome/free-solid-svg-icons';
import { cropPriceAPI, networkUtils } from '../../services/api';
import socketService from '../../services/socket';
import './Dashboard_new.css';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [cropPrices, setCropPrices] = useState([]);
  const [priceAnalytics, setPriceAnalytics] = useState([]);
  const [error, setError] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [serverStatus, setServerStatus] = useState(null);

  useEffect(() => {
    fetchDashboardData();
    
    // Network status listeners
    const handleOnline = () => {
      setIsOnline(true);
      setError(null);
      fetchDashboardData(); // Retry when back online
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setError('You are currently offline');
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Connect to WebSocket for real-time updates
    socketService.connect();
    socketService.onPriceUpdate(handleRealTimeUpdate);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      socketService.offPriceUpdate(handleRealTimeUpdate);
    };
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Check server health first
      const healthCheck = await networkUtils.checkServerHealth();
      setServerStatus(healthCheck);
      
      if (!healthCheck.online) {
        throw new Error('Server is not responding');
      }
      
      // Fetch featured crop prices for dashboard
      const featuredPrices = await cropPriceAPI.getFeatured();
      setCropPrices(featuredPrices);
      
      // Fetch price analytics
      const analytics = await cropPriceAPI.getAnalytics({ days: 7 });
      setPriceAnalytics(analytics);
      
    } catch (err) {
      setError(err.message);
      console.error('Error fetching dashboard data:', err);
      
      // Fallback to mock data if API fails
      setCropPrices([
        {
          cropName: 'yam',
          cropNameYoruba: 'Isu',
          pricePerUnit: { value: 2500, unit: 'per tuber' },
          market: { name: 'Igbaja Local Market' },
          lastUpdated: new Date(Date.now() - 2 * 60 * 60 * 1000),
          trend: { direction: 'rising', percentage: 8.7 }
        },
        {
          cropName: 'cassava',
          cropNameYoruba: 'Ege',
          pricePerUnit: { value: 800, unit: 'per bag' },
          market: { name: 'Igbaja Local Market' },
          lastUpdated: new Date(Date.now() - 1 * 60 * 60 * 1000),
          trend: { direction: 'falling', percentage: -5.2 }
        },
        {
          cropName: 'maize',
          cropNameYoruba: 'Agbado',
          pricePerUnit: { value: 1200, unit: 'per bag' },
          market: { name: 'Ilorin Central Market' },
          lastUpdated: new Date(Date.now() - 3 * 60 * 60 * 1000),
          trend: { direction: 'stable', percentage: 0 }
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleRealTimeUpdate = (update) => {
    if (update.type === 'new' || update.type === 'update') {
      const updatedPrice = update.data;
      
      setCropPrices(prev => {
        const existingIndex = prev.findIndex(p => p._id === updatedPrice._id);
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = updatedPrice;
          return updated;
        } else {
          return [updatedPrice, ...prev.slice(0, 5)]; // Keep only top 6
        }
      });
    }
  };

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
      icon: faArrowTrendUp,
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
      icon: faArrowTrendUp,
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
        <div className="loading-spinner">⏳</div>
        <p>Loading Igbaja AgriTech...</p>
      </div>
    );
  }

  return (
    <div className="modern-dashboard">
      {/* Welcome Banner */}
      <div className="dashboard-welcome">
        <div className="welcome-banner">
          <div className="banner-content">
            <h2>Kaabo si Igbaja AgriTech! 👋</h2>
            <p>Welcome to your farming companion. Get real-time crop prices, weather updates, and learn new skills.</p>
            <div className="banner-meta">
              <span>📅 12/08/2025</span>
              <span>📱 Mobile Optimized</span>
              <span className="active-users">
                <span>👥 1,247 Active Users</span>
              </span>
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

      {/* Main Content Grid - Crop Prices */}
      <div className="content-grid">
        <div className="crop-prices-section">
          <div className="section-header">
            <h3>📊 Latest Crop Prices</h3>
            <div className="header-actions">
              <button onClick={fetchDashboardData} className="refresh-btn">
                <FontAwesomeIcon icon={faRefresh} />
                Refresh
              </button>
              <Link to="/crop-prices" className="view-all-btn">
                <FontAwesomeIcon icon={faChartLine} />
                View All Prices
              </Link>
            </div>
          </div>
          
          {error && (
            <div className="error-banner">
              <FontAwesomeIcon icon={faExclamationTriangle} />
              <span>
                {isOnline ? 'Using offline data. ' : 'You are offline. '}
                {error}
                {!isOnline && ' - Data will refresh when connection is restored.'}
              </span>
              {isOnline && serverStatus && !serverStatus.online && (
                <div className="server-status">
                  <small>Server Status: Unavailable</small>
                </div>
              )}
            </div>
          )}
          
          <div className="crop-prices-grid">
            {cropPrices.map((crop, index) => {
              const formatLastUpdated = (dateString) => {
                const date = new Date(dateString);
                const now = new Date();
                const diffInMinutes = Math.floor((now - date) / (1000 * 60));
                
                if (diffInMinutes < 1) return 'Just now';
                if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
                if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
                return date.toLocaleDateString();
              };

              const getTrendIconFromData = (trend) => {
                if (!trend) return <FontAwesomeIcon icon={faMinus} className="trend-stable" />;
                
                switch (trend.direction) {
                  case 'rising':
                    return <FontAwesomeIcon icon={faArrowUp} className="trend-up" />;
                  case 'falling':
                    return <FontAwesomeIcon icon={faArrowDown} className="trend-down" />;
                  default:
                    return <FontAwesomeIcon icon={faMinus} className="trend-stable" />;
                }
              };

              return (
                <div key={crop._id || index} className="crop-price-card">
                  <div className="crop-header">
                    <div className="crop-info">
                      <h3>{crop.cropName}</h3>
                      <p className="crop-yoruba">{crop.cropNameYoruba}</p>
                    </div>
                    <div className="trend-indicator">
                      {getTrendIconFromData(crop.trend)}
                    </div>
                  </div>
                  
                  <div className="price-info">
                    <div className="current-price">
                      <span className="currency">₦</span>
                      <span className="amount">{crop.pricePerUnit.value.toLocaleString()}</span>
                    </div>
                    <p className="unit">{crop.pricePerUnit.unit}</p>
                  </div>
                  
                  {crop.trend && crop.trend.percentage !== 0 && (
                    <div className="price-comparison">
                      <span className="trend-label">Change:</span>
                      <span className={`trend-value ${crop.trend.direction === 'rising' ? 'positive' : crop.trend.direction === 'falling' ? 'negative' : 'neutral'}`}>
                        {crop.trend.percentage > 0 ? '+' : ''}{crop.trend.percentage}%
                      </span>
                    </div>
                  )}
                  
                  <div className="market-info">
                    <div className="location">
                      <FontAwesomeIcon icon={faMapMarkerAlt} />
                      <span>{crop.market.name}</span>
                    </div>
                    <div className="timestamp">
                      <FontAwesomeIcon icon={faClock} />
                      <span>Updated {formatLastUpdated(crop.lastUpdated)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {cropPrices.length === 0 && !loading && (
            <div className="empty-state">
              <p>No crop price data available</p>
              <Link to="/crop-prices" className="view-all-btn">
                <FontAwesomeIcon icon={faChartLine} />
                Explore Crop Prices
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;