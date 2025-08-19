import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faBell, faUser } from '@fortawesome/free-solid-svg-icons';
import './Header.css';

const Header = ({ onMenuClick }) => {
  return (
    <header className="header">
      <div className="header__left">
        <button 
          className="header__menu-button"
          onClick={onMenuClick}
          aria-label="Toggle menu"
        >
          <FontAwesomeIcon icon={faBars} />
        </button>
      </div>

      <div className="header__right">
        <button className="header__notification-btn" aria-label="Notifications">
          <FontAwesomeIcon icon={faBell} />
          <span className="header__notification-badge">3</span>
        </button>
        
        <div className="header__user">
          <div className="header__user-avatar">
            <FontAwesomeIcon icon={faUser} />
          </div>
          <div className="header__user-info">
            <span className="header__user-name">John Farmer</span>
            <span className="header__user-role">Farm Manager</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
