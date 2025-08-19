import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faLightbulb,
  faSeedling,
  faTint,
  faBug,
  faTractor,
  faVolumeUp,
  faClock
} from '@fortawesome/free-solid-svg-icons';
import './FarmingTips.css';

const FarmingTips = () => {
  const [activeCategory, setActiveCategory] = useState('All');
  const [language, setLanguage] = useState('English');

  const tips = [
    {
      id: 1,
      category: 'Pest Control',
      title: 'Natural Pest Control for Tomatoes',
      content: 'Learn how to protect your tomato crops using natural methods like neem oil, companion planting, and beneficial insects.',
      author: 'Dr. Funke Akintola',
      readTime: '6 min read',
      comments: 42,
      date: '3 days ago',
      icon: faBug,
      tag: 'Organic'
    },
    {
      id: 2,
      category: 'Irrigation',
      title: 'Efficient Water Management for Dry Season',
      content: 'Maximize your water usage during dry seasons with drip irrigation, mulching, and proper timing techniques.',
      author: 'Mr. David Bako',
      readTime: '8 min read',
      comments: 29,
      date: '1 week ago',
      icon: faTint,
      tag: 'Water Saving'
    },
    {
      id: 3,
      category: 'Planting',
      title: 'Best Time to Plant Yam in Igbaja',
      content: 'Understand the optimal planting seasons for yam in our local climate, including soil preparation and spacing.',
      author: 'Chief Adebayo',
      readTime: '4 min read',
      comments: 61,
      date: '2 days ago',
      icon: faSeedling,
      tag: 'Local Guide'
    },
    {
      id: 4,
      category: 'General',
      title: 'Composting Kitchen Waste for Better Soil',
      content: 'Turn your kitchen scraps into nutrient-rich compost to improve soil fertility and reduce waste.',
      author: 'Amina Bello',
      readTime: '5 min read',
      comments: 35,
      date: '5 days ago',
      icon: faTractor,
      tag: 'Sustainability'
    }
  ];

  const featuredTip = {
    title: 'Smart Irrigation Timing',
    content: 'Water your crops early morning (5-7 AM) or late evening (6-8 PM) to reduce evaporation and maximize absorption.',
    listenInYoruba: true,
    setReminder: true,
    icon: faTint
  };

  const filteredTips = activeCategory === 'All' ? tips : tips.filter(tip => tip.category === activeCategory);

  return (
    <div className="farming-tips-page">
      <div className="tips-header">
        <div className="header-content">
          <h2>Weekly Farming Tips</h2>
          <p>Expert advice in English and Yoruba for better farming</p>
        </div>
        <div className="language-toggle">
          <button
            className={language === 'English' ? 'active' : ''}
            onClick={() => setLanguage('English')}
          >
            English
          </button>
          <button
            className={language === 'Yoruba' ? 'active' : ''}
            onClick={() => setLanguage('Yoruba')}
          >
            Yoruba
          </button>
        </div>
      </div>

      <div className="tips-categories">
        {['All', 'Pest Control', 'Irrigation', 'Planting', 'General'].map(category => (
          <button
            key={category}
            className={activeCategory === category ? 'active' : ''}
            onClick={() => setActiveCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="tips-grid-layout">
        {filteredTips.map(tip => (
          <div key={tip.id} className="tip-item-card">
            <div className="card-header">
              <div className="category-info">
                <FontAwesomeIcon icon={tip.icon} className="category-icon" />
                <span>{tip.category}</span>
              </div>
              <span className="tip-tag">{tip.tag}</span>
            </div>
            <h3 className="tip-title">{tip.title}</h3>
            <p className="tip-excerpt">{tip.content}</p>
            <div className="tip-meta">
              <span>By {tip.author}</span>
              <span>{tip.date}</span>
            </div>
            <div className="card-footer">
              <button className="read-more-btn">Read More</button>
              <div className="read-info">
                <span>{tip.readTime}</span>
                <span>{tip.comments} comments</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="featured-tip-section">
        <h3>
          <FontAwesomeIcon icon={faLightbulb} /> Featured Tip of the Week
        </h3>
        <div className="featured-tip-card">
          <div className="featured-icon">
            <FontAwesomeIcon icon={featuredTip.icon} />
          </div>
          <div className="featured-content">
            <h4>{featuredTip.title}</h4>
            <p>{featuredTip.content}</p>
            <div className="featured-actions">
              {featuredTip.listenInYoruba && (
                <button className="action-btn">
                  <FontAwesomeIcon icon={faVolumeUp} /> Listen in Yoruba
                </button>
              )}
              {featuredTip.setReminder && (
                <button className="action-btn">
                  <FontAwesomeIcon icon={faClock} /> Set Reminder
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FarmingTips;
