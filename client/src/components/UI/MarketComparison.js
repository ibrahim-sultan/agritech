import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faMapMarkerAlt, 
  faArrowUp, 
  faArrowDown, 
  faMinus,
  faRefresh,
  faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';
import { cropPriceAPI } from '../../services/api';
import './MarketComparison.css';

const MarketComparison = ({ cropName, onMarketSelect }) => {
  const [marketData, setMarketData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedMarket, setSelectedMarket] = useState(null);

  useEffect(() => {
    if (cropName) {
      fetchMarketComparison();
    }
  }, [cropName]);

  const fetchMarketComparison = async () => {
    if (!cropName) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await cropPriceAPI.getMarketComparison({ cropName });
      setMarketData(data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching market comparison:', err);
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (averagePrice, latestPrice) => {
    if (!averagePrice || !latestPrice) return <FontAwesomeIcon icon={faMinus} className="trend-stable" />;
    
    const change = ((latestPrice - averagePrice) / averagePrice) * 100;
    
    if (change > 2) return <FontAwesomeIcon icon={faArrowUp} className="trend-up" />;
    if (change < -2) return <FontAwesomeIcon icon={faArrowDown} className="trend-down" />;
    return <FontAwesomeIcon icon={faMinus} className="trend-stable" />;
  };

  const getAvailabilityColor = (availability) => {
    switch (availability) {
      case 'abundant': return '#10b981';
      case 'moderate': return '#f59e0b';
      case 'scarce': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const handleMarketClick = (market) => {
    setSelectedMarket(market._id);
    if (onMarketSelect) {
      onMarketSelect(market);
    }
  };

  const formatLastUpdated = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="market-comparison">
        <div className="market-comparison-header">
          <h3>Market Comparison</h3>
          <div className="loading-spinner">Loading...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="market-comparison">
        <div className="market-comparison-header">
          <h3>Market Comparison</h3>
          <button onClick={fetchMarketComparison} className="refresh-btn">
            <FontAwesomeIcon icon={faRefresh} />
          </button>
        </div>
        <div className="error-message">
          <FontAwesomeIcon icon={faExclamationTriangle} />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!marketData || marketData.length === 0) {
    return (
      <div className="market-comparison">
        <div className="market-comparison-header">
          <h3>Market Comparison</h3>
        </div>
        <div className="no-data">
          <p>No market data available for {cropName}</p>
        </div>
      </div>
    );
  }

  // Find best and worst markets
  const bestMarket = marketData.reduce((min, market) => 
    market.latestPrice < min.latestPrice ? market : min
  );
  const worstMarket = marketData.reduce((max, market) => 
    market.latestPrice > max.latestPrice ? market : max
  );

  return (
    <div className="market-comparison">
      <div className="market-comparison-header">
        <h3>Market Comparison - {cropName}</h3>
        <button onClick={fetchMarketComparison} className="refresh-btn">
          <FontAwesomeIcon icon={faRefresh} />
        </button>
      </div>

      <div className="market-insights">
        <div className="insight-card best-market">
          <div className="insight-label">Best Price</div>
          <div className="insight-market">{bestMarket._id}</div>
          <div className="insight-price">₦{bestMarket.latestPrice?.toLocaleString()}</div>
        </div>
        <div className="insight-card worst-market">
          <div className="insight-label">Highest Price</div>
          <div className="insight-market">{worstMarket._id}</div>
          <div className="insight-price">₦{worstMarket.latestPrice?.toLocaleString()}</div>
        </div>
      </div>

      <div className="market-list">
        {marketData.map((market, index) => (
          <div 
            key={market._id} 
            className={`market-item ${selectedMarket === market._id ? 'selected' : ''}`}
            onClick={() => handleMarketClick(market)}
          >
            <div className="market-header">
              <div className="market-info">
                <FontAwesomeIcon icon={faMapMarkerAlt} className="location-icon" />
                <div className="market-name">{market._id}</div>
              </div>
              <div className="market-trend">
                {getTrendIcon(market.averagePrice, market.latestPrice)}
              </div>
            </div>

            <div className="market-prices">
              <div className="price-item">
                <span className="price-label">Current</span>
                <span className="price-value">₦{market.latestPrice?.toLocaleString()}</span>
              </div>
              <div className="price-item">
                <span className="price-label">Average</span>
                <span className="price-value">₦{Math.round(market.averagePrice)?.toLocaleString()}</span>
              </div>
            </div>

            <div className="market-details">
              <div className="detail-item">
                <span className="detail-label">Unit</span>
                <span className="detail-value">{market.unit}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Availability</span>
                <span 
                  className="detail-value availability-badge"
                  style={{ backgroundColor: getAvailabilityColor(market.availability) }}
                >
                  {market.availability}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Updated</span>
                <span className="detail-value">{formatLastUpdated(market.lastUpdated)}</span>
              </div>
            </div>

            {market._id === bestMarket._id && (
              <div className="market-badge best-badge">Best Price</div>
            )}
            {market._id === worstMarket._id && marketData.length > 1 && (
              <div className="market-badge highest-badge">Highest</div>
            )}
          </div>
        ))}
      </div>

      <div className="comparison-summary">
        <div className="summary-stat">
          <span className="summary-label">Markets</span>
          <span className="summary-value">{marketData.length}</span>
        </div>
        <div className="summary-stat">
          <span className="summary-label">Price Range</span>
          <span className="summary-value">
            ₦{Math.min(...marketData.map(m => m.latestPrice)).toLocaleString()} - 
            ₦{Math.max(...marketData.map(m => m.latestPrice)).toLocaleString()}
          </span>
        </div>
        <div className="summary-stat">
          <span className="summary-label">Avg Difference</span>
          <span className="summary-value">
            ₦{Math.round((worstMarket.latestPrice - bestMarket.latestPrice)).toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default MarketComparison;
