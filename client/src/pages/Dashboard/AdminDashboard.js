import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUpload, faUsers, faChartBar, faPlus, faSeedling, faCog } from '@fortawesome/free-solid-svg-icons';
import './Dashboard_new.css';

const AdminDashboard = () => {
  return (
    <div className="modern-dashboard admin-dashboard">
      <div className="dashboard-welcome">
        <div className="welcome-banner admin-banner">
          <div className="banner-content">
            <h2>Administrator Control Center 🔧</h2>
            <p>Manage crop prices, users, content, and system settings.</p>
            <div className="banner-meta">
              <span>👑 Admin</span>
              <span>Full Access</span>
            </div>
          </div>
          <div className="banner-visual">
            <div className="growth-icon">🛠️</div>
          </div>
        </div>
      </div>

      <div className="stats-grid">
        <Link to="/crop-prices" className="stat-card clickable">
          <div className="stat-icon" style={{ backgroundColor: '#10b981' }}>
            <FontAwesomeIcon icon={faUpload} />
          </div>
          <div className="stat-content">
            <h3>Prices</h3>
            <p>Upload/Manage Crop Prices</p>
          </div>
        </Link>
        <Link to="/analytics" className="stat-card clickable">
          <div className="stat-icon" style={{ backgroundColor: '#3b82f6' }}>
            <FontAwesomeIcon icon={faChartBar} />
          </div>
          <div className="stat-content">
            <h3>Analytics</h3>
            <p>Platform Insights</p>
          </div>
        </Link>
        <Link to="/admin/users" className="stat-card clickable">
          <div className="stat-icon" style={{ backgroundColor: '#8b5cf6' }}>
            <FontAwesomeIcon icon={faUsers} />
          </div>
          <div className="stat-content">
            <h3>Users</h3>
            <p>Manage Users</p>
          </div>
        </Link>
        <Link to="/farming-tips" className="stat-card clickable">
          <div className="stat-icon" style={{ backgroundColor: '#f59e0b' }}>
            <FontAwesomeIcon icon={faPlus} />
          </div>
          <div className="stat-content">
            <h3>Content</h3>
            <p>Add Tips & Training</p>
          </div>
        </Link>
        <Link to="/marketplace" className="stat-card clickable">
          <div className="stat-icon" style={{ backgroundColor: '#ef4444' }}>
            <FontAwesomeIcon icon={faSeedling} />
          </div>
          <div className="stat-content">
            <h3>Marketplace</h3>
            <p>Manage Listings</p>
          </div>
        </Link>
        <Link to="/admin/settings" className="stat-card clickable">
          <div className="stat-icon" style={{ backgroundColor: '#64748b' }}>
            <FontAwesomeIcon icon={faCog} />
          </div>
          <div className="stat-content">
            <h3>Settings</h3>
            <p>System Configuration</p>
          </div>
        </Link>
      </div>

      <div className="content-grid">
        <div className="quick-actions">
          <h3>Quick Actions</h3>
          <ul>
            <li><Link to="/crop-prices">Upload new crop price</Link></li>
            <li><Link to="/farming-tips">Add farming tip</Link></li>
            <li><Link to="/training">Publish training content</Link></li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
