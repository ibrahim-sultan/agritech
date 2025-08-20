import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSeedling,
  faChartLine,
  faMapMarkerAlt,
  faBell,
  faFilter,
  faSearch,
  faRefresh,
  faClock,
  faArrowUp,
  faArrowDown,
  faMinus,
  faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';
import PriceChart from '../../components/Charts/PriceChart';
import MarketComparison from '../../components/UI/MarketComparison';
import { cropPriceAPI } from '../../services/api';
import socketService from '../../services/socket';
import './CropPrices.css';

const CropPrices = () => {
  const [cropPrices, setCropPrices] = useState([]);
  const [selectedCrop, setSelectedCrop] = useState('yam');
  const [selectedMarket, setSelectedMarket] = useState('');
  const [priceAnalytics, setPriceAnalytics] = useState(null);
  const [priceTrends, setPriceTrends] = useState([]);
  const [predictions, setPredictions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    season: '',
    availability: '',
    quality: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [realTimeUpdates, setRealTimeUpdates] = useState(true);

  const cropOptions = [
    { value: 'yam', label: 'Yam (Isu)', icon: '🍠' },
    { value: 'cassava', label: 'Cassava (Ege)', icon: '🥔' },
    { value: 'maize', label: 'Maize (Agbado)', icon: '🌽' },
    { value: 'tomatoes', label: 'Tomatoes (Tomati)', icon: '🍅' },
    { value: 'beans', label: 'Beans (Ewa)', icon: '🫘' },
    { value: 'pepper', label: 'Pepper (Ata)', icon: '🌶️' }
  ];

  const marketOptions = [
    { value: '', label: 'All Markets' },
    { value: 'Igbaja Local Market', label: 'Igbaja Local Market' },
    { value: 'Ilorin Central Market', label: 'Ilorin Central Market' },
    { value: 'Offa Market', label: 'Offa Market' },
    { value: 'Lagos Wholesale Market', label: 'Lagos Wholesale Market' }
  ];

  useEffect(() => {
    fetchCropPrices();
    fetchPriceAnalytics();
    fetchPriceTrends();
    fetchPredictions();
  }, [selectedCrop, selectedMarket, filters]);

  useEffect(() => {
    if (realTimeUpdates) {
      // Connect to WebSocket for real-time updates
      socketService.connect();
      socketService.onPriceUpdate(handleRealTimeUpdate);
      
      return () => {
        socketService.offPriceUpdate(handleRealTimeUpdate);
      };
    }
  }, [realTimeUpdates]);

  const handleRealTimeUpdate = (update) => {
    console.log('📊 Real-time price update received:', update);
    
    if (update.type === 'new' || update.type === 'update') {
      const updatedPrice = update.data;
      
      // Update crop prices if it matches current filters
      if (updatedPrice.cropName === selectedCrop) {
        setCropPrices(prev => {
          const existingIndex = prev.findIndex(p => p._id === updatedPrice._id);
          if (existingIndex >= 0) {
            const updated = [...prev];
            updated[existingIndex] = updatedPrice;
            return updated;
          } else {
            return [updatedPrice, ...prev];
          }
        });
        
        // Refresh analytics and trends
        fetchPriceAnalytics();
        fetchPriceTrends();
      }
    }
  };

  const fetchCropPrices = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = {
        cropName: selectedCrop,
        market: selectedMarket,
        ...filters,
        limit: 20
      };
      
      const data = await cropPriceAPI.getAll(params);
      setCropPrices(data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching crop prices:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPriceAnalytics = async () => {
    try {
      const params = {
        cropName: selectedCrop,
        market: selectedMarket,
        days: 30
      };
      
      const data = await cropPriceAPI.getAnalytics(params);
      setPriceAnalytics(data);
    } catch (err) {
      console.error('Error fetching price analytics:', err);
    }
  };

  const fetchPriceTrends = async () => {
    try {
      const params = {
        cropName: selectedCrop,
        days: 30
      };
      
      const data = await cropPriceAPI.getTrends(params);
      setPriceTrends(data);
    } catch (err) {
      console.error('Error fetching price trends:', err);
    }
  };

  const fetchPredictions = async () => {
    try {
      const params = {
        cropName: selectedCrop,
        market: selectedMarket
      };
      
      const data = await cropPriceAPI.getPredictions(params);
      setPredictions(data);
    } catch (err) {
      console.error('Error fetching predictions:', err);
    }
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      season: '',
      availability: '',
      quality: ''
    });
    setSearchTerm('');
    setSelectedMarket('');
  };

  const getTrendIcon = (trend) => {
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

  const formatLastUpdated = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const selectedCropData = cropOptions.find(crop => crop.value === selectedCrop);

  return (
    <div className="crop-prices-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-content">
          <h1>
            <FontAwesomeIcon icon={faSeedling} className="page-icon" />
            Crop Prices Dashboard
          </h1>
          <p>Real-time crop prices, market analysis, and predictions for Igbaja AgriTech</p>
        </div>
        
        <div className="header-actions">
          <button 
            className={`real-time-toggle ${realTimeUpdates ? 'active' : ''}`}
            onClick={() => setRealTimeUpdates(!realTimeUpdates)}
          >
            <FontAwesomeIcon icon={faBell} />
            Real-time Updates
          </button>
          <button className="refresh-btn" onClick={fetchCropPrices}>
            <FontAwesomeIcon icon={faRefresh} />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filter-group">
          <label>Crop</label>
          <select 
            value={selectedCrop} 
            onChange={(e) => setSelectedCrop(e.target.value)}
          >
            {cropOptions.map(crop => (
              <option key={crop.value} value={crop.value}>
                {crop.icon} {crop.label}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Market</label>
          <select 
            value={selectedMarket} 
            onChange={(e) => setSelectedMarket(e.target.value)}
          >
            {marketOptions.map(market => (
              <option key={market.value} value={market.value}>
                {market.label}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Season</label>
          <select 
            value={filters.season} 
            onChange={(e) => handleFilterChange('season', e.target.value)}
          >
            <option value="">All Seasons</option>
            <option value="wet_season">Wet Season</option>
            <option value="dry_season">Dry Season</option>
            <option value="harvest_season">Harvest Season</option>
            <option value="planting_season">Planting Season</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Availability</label>
          <select 
            value={filters.availability} 
            onChange={(e) => handleFilterChange('availability', e.target.value)}
          >
            <option value="">All</option>
            <option value="abundant">Abundant</option>
            <option value="moderate">Moderate</option>
            <option value="scarce">Scarce</option>
          </select>
        </div>

        <button className="clear-filters-btn" onClick={clearFilters}>
          Clear Filters
        </button>
      </div>

      {/* Analytics Cards */}
      {priceAnalytics && priceAnalytics.length > 0 && (
        <div className="analytics-cards">
          {priceAnalytics.map((analytics, index) => (
            <div key={analytics._id} className="analytics-card">
              <div className="card-header">
                <h3>{selectedCropData?.icon} {analytics._id}</h3>
                <span className="yoruba-name">({analytics.cropNameYoruba})</span>
              </div>
              <div className="card-stats">
                <div className="stat-item">
                  <span className="stat-label">Average Price</span>
                  <span className="stat-value">₦{Math.round(analytics.averagePrice).toLocaleString()}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Price Range</span>
                  <span className="stat-value">
                    ₦{analytics.minPrice.toLocaleString()} - ₦{analytics.maxPrice.toLocaleString()}
                  </span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Markets</span>
                  <span className="stat-value">{analytics.markets.length}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Volatility</span>
                  <span className="stat-value">
                    {analytics.priceVolatility ? `₦${Math.round(analytics.priceVolatility).toLocaleString()}` : 'Low'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Main Content Grid */}
      <div className="main-content">
        {/* Price Chart */}
        <div className="chart-section">
          <PriceChart 
            data={priceTrends}
            title={`${selectedCropData?.label} Price Trends (30 Days)`}
            cropName={selectedCropData?.label}
            unit={priceTrends[0]?.pricePerUnit?.unit || ''}
            height={350}
          />
        </div>

        {/* Market Comparison */}
        <div className="comparison-section">
          <MarketComparison 
            cropName={selectedCrop}
            onMarketSelect={(market) => setSelectedMarket(market._id)}
          />
        </div>
      </div>

      {/* Predictions Section */}
      {predictions && (
        <div className="predictions-section">
          <div className="predictions-card">
            <div className="predictions-header">
              <h3>
                <FontAwesomeIcon icon={faChartLine} />
                Price Predictions
              </h3>
              <span className="confidence-badge">
                Confidence: {predictions.confidence}
              </span>
            </div>
            
            <div className="predictions-content">
              <div className="prediction-item">
                <span className="prediction-label">Current Price</span>
                <span className="prediction-value">₦{predictions.currentPrice?.toLocaleString()}</span>
              </div>
              <div className="prediction-item">
                <span className="prediction-label">Predicted Price (7 days)</span>
                <span className="prediction-value">₦{predictions.predictedPrice?.toLocaleString()}</span>
              </div>
              <div className="prediction-item">
                <span className="prediction-label">Expected Change</span>
                <span className={`prediction-value ${predictions.trend?.direction === 'rising' ? 'positive' : predictions.trend?.direction === 'falling' ? 'negative' : ''}`}>
                  {getTrendIcon(predictions.trend)}
                  {predictions.trend?.percentage}%
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Current Prices List */}
      <div className="prices-list-section">
        <div className="section-header">
          <h3>Current Prices</h3>
          <span className="prices-count">{cropPrices.length} records</span>
        </div>

        {loading && (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading crop prices...</p>
          </div>
        )}

        {error && (
          <div className="error-state">
            <FontAwesomeIcon icon={faExclamationTriangle} />
            <p>{error}</p>
            <button onClick={fetchCropPrices}>Try Again</button>
          </div>
        )}

        {!loading && !error && cropPrices.length === 0 && (
          <div className="empty-state">
            <FontAwesomeIcon icon={faSeedling} />
            <p>No crop prices found for the selected filters</p>
            <button onClick={clearFilters}>Clear Filters</button>
          </div>
        )}

        {!loading && !error && cropPrices.length > 0 && (
          <div className="prices-grid">
            {cropPrices.map((price, index) => (
              <div key={price._id || index} className="price-card">
                <div className="price-header">
                  <div className="crop-info">
                    <h4>{selectedCropData?.icon} {price.cropName}</h4>
                    <span className="yoruba-name">({price.cropNameYoruba})</span>
                  </div>
                  <div className="trend-indicator">
                    {getTrendIcon(price.trend)}
                  </div>
                </div>

                <div className="price-main">
                  <div className="current-price">
                    <span className="currency">₦</span>
                    <span className="amount">{price.pricePerUnit.value.toLocaleString()}</span>
                  </div>
                  <p className="unit">{price.pricePerUnit.unit}</p>
                </div>

                <div className="price-details">
                  <div className="detail-row">
                    <FontAwesomeIcon icon={faMapMarkerAlt} />
                    <span>{price.market.name}</span>
                  </div>
                  <div className="detail-row">
                    <span className="availability-badge" data-availability={price.availability}>
                      {price.availability}
                    </span>
                    <span className="quality-badge" data-quality={price.quality}>
                      {price.quality}
                    </span>
                  </div>
                  <div className="detail-row">
                    <FontAwesomeIcon icon={faClock} />
                    <span>Updated {formatLastUpdated(price.lastUpdated)}</span>
                  </div>
                </div>

                {price.trend && price.trend.percentage !== 0 && (
                  <div className="price-change">
                    <span className={`change-indicator ${price.trend.direction}`}>
                      {getTrendIcon(price.trend)}
                      {Math.abs(price.trend.percentage)}% {price.trend.direction}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CropPrices;
