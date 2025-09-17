import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLightbulb, faGraduationCap, faLeaf } from '@fortawesome/free-solid-svg-icons';
import './Dashboard_new.css';

const ExpertDashboard = () => {
  return (
    <div className="modern-dashboard expert-dashboard">
      <div className="dashboard-welcome">
        <div className="welcome-banner expert-banner">
          <div className="banner-content">
            <h2>Agricultural Expert Workspace 🧑‍🌾</h2>
            <p>Share expertise: add farming tips, trainings, and respond to farmer needs.</p>
            <div className="banner-meta">
              <span>🎓 Expert</span>
              <span>Content & Advisory</span>
            </div>
          </div>
          <div className="banner-visual">
            <div className="growth-icon">📚</div>
          </div>
        </div>
      </div>

      <div className="stats-grid">
        <Link to="/farming-tips" className="stat-card clickable">
          <div className="stat-icon" style={{ backgroundColor: '#10b981' }}>
            <FontAwesomeIcon icon={faLightbulb} />
          </div>
          <div className="stat-content">
            <h3>Farming Tips</h3>
            <p>Create/Manage tips</p>
          </div>
        </Link>
        <Link to="/training" className="stat-card clickable">
          <div className="stat-icon" style={{ backgroundColor: '#8b5cf6' }}>
            <FontAwesomeIcon icon={faGraduationCap} />
          </div>
          <div className="stat-content">
            <h3>Training</h3>
            <p>Publish modules</p>
          </div>
        </Link>
        <Link to="/crops" className="stat-card clickable">
          <div className="stat-icon" style={{ backgroundColor: '#3b82f6' }}>
            <FontAwesomeIcon icon={faLeaf} />
          </div>
          <div className="stat-content">
            <h3>Crop Management</h3>
            <p>Advise & review</p>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default ExpertDashboard;
