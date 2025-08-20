import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faLeaf,
  faPhone,
  faEnvelope,
  faMapMarkerAlt,
  faHeart,
  faHome,
  faSeedling,
  faCloudSun,
  faLightbulb,
  faGraduationCap,
  faExclamationTriangle,
  faGlobe,
  faComment,
  faCamera,
  faComments
} from '@fortawesome/free-solid-svg-icons';
import './Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const quickLinks = [
    { path: '/dashboard', label: 'Dashboard', icon: faHome },
    { path: '/crops', label: 'Crops', icon: faSeedling },
    { path: '/weather', label: 'Weather', icon: faCloudSun },
    { path: '/farming-tips', label: 'Farm Tips', icon: faLightbulb },
    { path: '/training', label: 'Training', icon: faGraduationCap },
    { path: '/alerts', label: 'Alerts', icon: faExclamationTriangle }
  ];

  const supportLinks = [
    { label: 'Help Center', href: '#' },
    { label: 'Contact Support', href: '#' },
    { label: 'Community Guidelines', href: '#' },
    { label: 'Privacy Policy', href: '#' },
    { label: 'Terms of Service', href: '#' },
    { label: 'FAQ', href: '#' }
  ];

  const communityLinks = [
    { label: 'Igbaja Farmers Association', href: '#' },
    { label: 'Youth Training Programs', href: '#' },
    { label: 'Local Markets', href: '#' },
    { label: 'Agricultural Extension', href: '#' },
    { label: 'Cooperative Societies', href: '#' },
    { label: 'Success Stories', href: '#' }
  ];

  return (
    <footer className="footer">
      <div className="footer__container">
        {/* Main Footer Content */}
        <div className="footer__main">
          {/* Brand Section */}
          <div className="footer__brand">
            <div className="footer__logo">
              <FontAwesomeIcon icon={faLeaf} className="footer__logo-icon" />
              <span className="footer__logo-text">Igbaja AgriTech</span>
            </div>
            <p className="footer__description">
              Empowering the Igbaja farming community with modern technology, 
              real-time market information, and digital skills training. 
              Building a sustainable agricultural future together.
            </p>
            <div className="footer__social">
              <a href="#" className="footer__social-link facebook" aria-label="Facebook">
                <FontAwesomeIcon icon={faGlobe} />
              </a>
              <a href="#" className="footer__social-link twitter" aria-label="Twitter">
                <FontAwesomeIcon icon={faComment} />
              </a>
              <a href="#" className="footer__social-link instagram" aria-label="Instagram">
                <FontAwesomeIcon icon={faCamera} />
              </a>
              <a href="#" className="footer__social-link whatsapp" aria-label="WhatsApp">
                <FontAwesomeIcon icon={faComments} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="footer__section">
            <h3 className="footer__section-title">Quick Links</h3>
            <ul className="footer__links">
              {quickLinks.map((link, index) => (
                <li key={index} className="footer__link-item">
                  <Link to={link.path} className="footer__link">
                    <FontAwesomeIcon icon={link.icon} className="footer__link-icon" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div className="footer__section">
            <h3 className="footer__section-title">Support</h3>
            <ul className="footer__links">
              {supportLinks.map((link, index) => (
                <li key={index} className="footer__link-item">
                  <a href={link.href} className="footer__link">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Community */}
          <div className="footer__section">
            <h3 className="footer__section-title">Community</h3>
            <ul className="footer__links">
              {communityLinks.map((link, index) => (
                <li key={index} className="footer__link-item">
                  <a href={link.href} className="footer__link">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div className="footer__section">
            <h3 className="footer__section-title">Contact Us</h3>
            <div className="footer__contact">
              <div className="footer__contact-item">
                <FontAwesomeIcon icon={faMapMarkerAlt} className="footer__contact-icon" />
                <div className="footer__contact-info">
                  <span>Igbaja, Ifelodun LGA</span>
                  <span>Kwara State, Nigeria</span>
                </div>
              </div>
              <div className="footer__contact-item">
                <FontAwesomeIcon icon={faPhone} className="footer__contact-icon" />
                <div className="footer__contact-info">
                  <span>+234 803 XXX XXXX</span>
                  <span>+234 805 XXX XXXX</span>
                </div>
              </div>
              <div className="footer__contact-item">
                <FontAwesomeIcon icon={faEnvelope} className="footer__contact-icon" />
                <div className="footer__contact-info">
                  <span>info@igbajaagritech.ng</span>
                  <span>support@igbajaagritech.ng</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Newsletter Section */}
        <div className="footer__newsletter">
          <div className="newsletter__content">
            <h3>Stay Updated</h3>
            <p>Get the latest crop prices, weather updates, and farming tips delivered to your phone.</p>
          </div>
          <div className="newsletter__form">
            <input 
              type="tel" 
              placeholder="Enter your phone number" 
              className="newsletter__input"
            />
            <button className="newsletter__button">
              Subscribe
            </button>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer__bottom">
          <div className="footer__bottom-content">
            <div className="footer__copyright">
              <p>
                © {currentYear} Igbaja AgriTech. Made with{' '}
                <FontAwesomeIcon icon={faHeart} className="footer__heart" />{' '}
                for the farming community.
              </p>
            </div>
            <div className="footer__bottom-links">
              <a href="#" className="footer__bottom-link">Privacy</a>
              <a href="#" className="footer__bottom-link">Terms</a>
              <a href="#" className="footer__bottom-link">Accessibility</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;