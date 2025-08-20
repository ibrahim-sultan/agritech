import React, { useState } from 'react';
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
  faLeaf,
  faBars,
  faTimes,
  faLightbulb,
  faGraduationCap
} from '@fortawesome/free-solid-svg-icons';
import './Navbar.css';

const Navbar = ({ currentPath }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigationItems = [
    {
      path: '/dashboard',
      icon: faHome,
      label: 'Dashboard',
      color: '#3b82f6'
    },
    {
      path: '/crops',
      icon: faSeedling,
      label: 'Crops',
      color: '#84cc16'
    },
    {
      path: '/crop-prices',
      icon: faChartLine,
      label: 'Prices',
      color: '#f59e0b'
    },
    {
      path: '/weather',
      icon: faCloudSun,
      label: 'Weather',
      color: '#06b6d4'
    },
    {
      path: '/farming-tips',
      icon: faLightbulb,
      label: 'Farm Tips',
      color: '#10b981'
    },
    {
      path: '/training',
      icon: faGraduationCap,
      label: 'Training',
      color: '#8b5cf6'
    },
    {
      path: '/alerts',
      icon: faExclamationTriangle,
      label: 'Alerts',
      color: '#ef4444'
    }
  ];

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="navbar__container">
        {/* Logo */}
        <div className="navbar__logo">
          <FontAwesomeIcon icon={faLeaf} className="navbar__logo-icon" />
          <span className="navbar__logo-text">Igbaja AgriTech</span>
        </div>

        {/* Desktop Navigation */}
        <ul className="navbar__nav">
          {navigationItems.map((item) => (
            <li key={item.path} className="navbar__nav-item">
              <Link
                to={item.path}
                className={`navbar__nav-link ${currentPath === item.path ? 'navbar__nav-link--active' : ''}`}
              >
                <FontAwesomeIcon
                  icon={item.icon}
                  className="navbar__nav-icon"
                  style={{ color: currentPath === item.path ? item.color : undefined }}
                />
                <span className="navbar__nav-text">{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>

        {/* Mobile Menu Button */}
        <button 
          className="navbar__mobile-toggle"
          onClick={toggleMobileMenu}
          aria-label="Toggle mobile menu"
        >
          <FontAwesomeIcon icon={mobileMenuOpen ? faTimes : faBars} />
        </button>
      </div>

      {/* Mobile Navigation */}
      <div className={`navbar__mobile ${mobileMenuOpen ? 'navbar__mobile--open' : ''}`}>
        <ul className="navbar__mobile-nav">
          {navigationItems.map((item) => (
            <li key={item.path} className="navbar__mobile-item">
              <Link
                to={item.path}
                className={`navbar__mobile-link ${currentPath === item.path ? 'navbar__mobile-link--active' : ''}`}
                onClick={closeMobileMenu}
              >
                <FontAwesomeIcon
                  icon={item.icon}
                  className="navbar__mobile-icon"
                  style={{ color: currentPath === item.path ? item.color : undefined }}
                />
                <span className="navbar__mobile-text">{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div className="navbar__overlay" onClick={closeMobileMenu}></div>
      )}
    </nav>
  );
};

export default Navbar;