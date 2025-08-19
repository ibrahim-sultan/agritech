import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowUp,
  faArrowDown,
  faMinus,
  faMapMarkerAlt,
  faClock,
  faSearch,
  faFilter
} from '@fortawesome/free-solid-svg-icons';
import './Crops.css';

const Crops = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMarket, setFilterMarket] = useState('all');
  
  // Crop prices data (same as Dashboard)
  const cropPrices = [
    {
      name: 'Yam',
      nameYoruba: 'Isu',
      price: 2500,
      unit: 'per tuber',
      previousPrice: 2300,
      market: 'Igbaja Central Market',
      lastUpdated: '2 hours ago',
      trend: 'up',
      category: 'Tubers',
      description: 'High-quality yam varieties available fresh from local farms'
    },
    {
      name: 'Cassava',
      nameYoruba: 'Ege',
      price: 800,
      unit: 'per bag',
      previousPrice: 850,
      market: 'Igbaja Central Market',
      lastUpdated: '1 hour ago',
      trend: 'down',
      category: 'Tubers',
      description: 'Fresh cassava roots perfect for processing and consumption'
    },
    {
      name: 'Maize',
      nameYoruba: 'Agbado',
      price: 1200,
      unit: 'per bag',
      previousPrice: 1200,
      market: 'Ilorin Regional Market',
      lastUpdated: '3 hours ago',
      trend: 'stable',
      category: 'Grains',
      description: 'Premium yellow and white maize varieties for various uses'
    },
    {
      name: 'Tomatoes',
      nameYoruba: 'Tomati',
      price: 3500,
      unit: 'per basket',
      previousPrice: 3200,
      market: 'Igbaja Central Market',
      lastUpdated: '30 minutes ago',
      trend: 'up',
      category: 'Vegetables',
      description: 'Fresh red tomatoes ideal for cooking and processing'
    },
    {
      name: 'Beans',
      nameYoruba: 'Ewa',
      price: 1800,
      unit: 'per bag',
      previousPrice: 1900,
      market: 'Ilorin Regional Market',
      lastUpdated: '1 hour ago',
      trend: 'down',
      category: 'Legumes',
      description: 'Quality beans rich in protein and perfect for local dishes'
    },
    {
      name: 'Pepper',
      nameYoruba: 'Ata',
      price: 2200,
      unit: 'per basket',
      previousPrice: 2100,
      market: 'Igbaja Central Market',
      lastUpdated: '45 minutes ago',
      trend: 'up',
      category: 'Vegetables',
      description: 'Spicy peppers perfect for traditional Nigerian cuisine'
    },
    {
      name: 'Rice',
      nameYoruba: 'Iresi',
      price: 2800,
      unit: 'per bag',
      previousPrice: 2750,
      market: 'Ilorin Regional Market',
      lastUpdated: '4 hours ago',
      trend: 'up',
      category: 'Grains',
      description: 'Local rice varieties with excellent quality and taste'
    },
    {
      name: 'Okra',
      nameYoruba: 'Ila',
      price: 1500,
      unit: 'per basket',
      previousPrice: 1400,
      market: 'Igbaja Central Market',
      lastUpdated: '2 hours ago',
      trend: 'up',
      category: 'Vegetables',
      description: 'Fresh okra perfect for soups and traditional dishes'
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

  // Filter crops based on search and market
  const filteredCrops = cropPrices.filter(crop => {
    const matchesSearch = crop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         crop.nameYoruba.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         crop.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMarket = filterMarket === 'all' || crop.market === filterMarket;
    return matchesSearch && matchesMarket;
  });

  const markets = [...new Set(cropPrices.map(crop => crop.market))];

  return (
    <div className="crops-page">
      <div className="crops-header">
        <h1>🌾 Crop Prices</h1>
        <p>Real-time crop prices from Igbaja and surrounding markets</p>
        
        {/* Search and Filter Controls */}
        <div className="crops-controls">
          <div className="search-box">
            <FontAwesomeIcon icon={faSearch} className="search-icon" />
            <input
              type="text"
              placeholder="Search crops, categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="filter-box">
            <FontAwesomeIcon icon={faFilter} className="filter-icon" />
            <select
              value={filterMarket}
              onChange={(e) => setFilterMarket(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Markets</option>
              {markets.map(market => (
                <option key={market} value={market}>{market}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="crops-grid">
        {filteredCrops.map((crop, index) => (
          <div key={index} className="crop-card">
            <div className="crop-header">
              <div className="crop-info">
                <h3>{crop.name}</h3>
                <p className="crop-yoruba">{crop.nameYoruba}</p>
                <span className="crop-category">{crop.category}</span>
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
            
            <div className="crop-description">
              <p>{crop.description}</p>
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

      {filteredCrops.length === 0 && (
        <div className="no-results">
          <p>No crops found matching your criteria.</p>
          <button onClick={() => {setSearchTerm(''); setFilterMarket('all');}} className="reset-filters">
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
};

export default Crops;
