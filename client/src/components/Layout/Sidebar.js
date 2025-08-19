import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faHome,
  faTractor,
  faSeedling,
  faMicrochip,
  faCloudSun,
  faExclamationTriangle,
  faChartLine,
  faLeaf
} from '@fortawesome/free-solid-svg-icons';
import './Sidebar.css';

const Sidebar = ({ isOpen, onToggle, currentPath }) => {
  const navigationItems = [
    {
      path: '/dashboard',
      icon: faHome,
      label: 'Dashboard',
      color: '#3b82f6'
    },
    {
      path: '/farms',
      icon: faTractor,
      label: 'Farms',
      color: '#22c55e'
    },
    {
      path: '/crops',
      icon: faSeedling,
      label: 'Crops',
      color: '#84cc16'
    },
    {
      path: '/sensors',
      icon: faMicrochip,
      label: 'Sensors',
      color: '#8b5cf6'
    },
    {
      path: '/weather',
      icon: faCloudSun,
      label: 'Weather',
      color: '#06b6d4'
    },
    {
      path: '/alerts',
      icon: faExclamationTriangle,
      label: 'Alerts',
      color: '#ef4444'
    },
    {
      path: '/analytics',
      icon: faChartLine,
      label: 'Analytics',
      color: '#f59e0b'
    }
  ];

  return (
    <aside className={`sidebar ${isOpen ? 'sidebar--open' : ''}`}>
      <div className="sidebar__header">
        <div className="sidebar__logo">
          <FontAwesomeIcon icon={faLeaf} className="sidebar__logo-icon" />
          <span className="sidebar__logo-text">AgriTech</span>
        </div>
      </div>

      <nav className="sidebar__nav">
        <ul className="sidebar__nav-list">
          {navigationItems.map((item) => (
            <li key={item.path} className="sidebar__nav-item">
              <Link
                to={item.path}
                className={`sidebar__nav-link ${currentPath === item.path ? 'sidebar__nav-link--active' : ''}`}
                onClick={() => window.innerWidth <= 1024 && onToggle()}
              >
                <FontAwesomeIcon
                  icon={item.icon}
                  className="sidebar__nav-icon"
                  style={{ color: currentPath === item.path ? item.color : undefined }}
                />
                <span className="sidebar__nav-text">{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="sidebar__footer">
        <div className="sidebar__footer-content">
          <p className="sidebar__footer-text">
            Modern Farm Management
          </p>
          <p className="sidebar__footer-version">v1.0.0</p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
