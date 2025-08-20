import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faExclamationTriangle,
  faPhone,
  faShieldAlt,
  faEye,
  faTractor,
  faSeedling,
  faUsers,
  faMapMarkerAlt,
  faClock,
  faPhoneAlt,
  faHeadset,
  faBuilding,
  faAmbulance
} from '@fortawesome/free-solid-svg-icons';
import './Alerts.css';

const Alerts = () => {
  const [activeTab, setActiveTab] = useState('security');

  const securityAlerts = [
    {
      id: 1,
      type: 'incident',
      title: 'Report Incident',
      description: 'Report theft, vandalism or suspicious activity',
      priority: 'high',
      action: 'Report',
      icon: faExclamationTriangle,
      color: '#ef4444'
    },
    {
      id: 2,
      type: 'emergency',
      title: 'Emergency Call',
      description: 'Quick access to emergency services',
      priority: 'critical',
      action: 'Call Now',
      icon: faPhone,
      color: '#3b82f6'
    }
  ];

  const communityReports = [
    {
      id: 1,
      type: 'equipment',
      title: 'Farm Equipment Stolen',
      description: 'Water pump and irrigation pipes taken from farm near river',
      location: 'Igbaja North',
      timeAgo: '2 hours ago',
      status: 'investigating',
      anonymous: true
    },
    {
      id: 2,
      type: 'crop',
      title: 'Crop Damage',
      description: 'Cassava plants destroyed in our farm',
      location: 'Igbaja South',
      timeAgo: '1 day ago',
      status: 'resolved',
      anonymous: false
    },
    {
      id: 3,
      type: 'suspicious',
      title: 'Suspicious Activity',
      description: 'Unknown persons seen around storage facility at night',
      location: 'Igbaja Central',
      timeAgo: '3 hours ago',
      status: 'active',
      anonymous: true
    }
  ];

  const emergencyContacts = [
    {
      id: 1,
      name: 'Igbaja Police Station',
      type: 'Police',
      number: '+234 803 XXX XXXX',
      available: true,
      icon: faShieldAlt,
      color: '#3b82f6'
    },
    {
      id: 2,
      name: 'Community Security',
      type: 'Local Security',
      number: '+234 803 XXX XXXX',
      available: true,
      icon: faUsers,
      color: '#10b981'
    },
    {
      id: 3,
      name: 'Agricultural Officer',
      type: 'Farm Support',
      number: '+234 805 XXX XXXX',
      available: false,
      icon: faTractor,
      color: '#f59e0b'
    },
    {
      id: 4,
      name: 'Emergency Services',
      type: 'Emergency',
      number: '199',
      available: true,
      icon: faAmbulance,
      color: '#ef4444'
    }
  ];

  const farmSecurityTips = [
    {
      id: 1,
      title: 'Stay Vigilant',
      description: 'Always be aware of your surroundings. Report security to prevent bigger incidents.',
      icon: faEye,
      priority: 'high'
    },
    {
      id: 2,
      title: 'Community Watch',
      description: 'Work together with neighboring farmers. Share contact information and watch out for each other\'s farms.',
      icon: faUsers,
      priority: 'medium'
    },
    {
      id: 3,
      title: 'Secure Equipment',
      description: 'Lock up valuable farming equipment and tools. Consider marking them with your contact information.',
      icon: faTractor,
      priority: 'high'
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#ef4444';
      case 'investigating': return '#f59e0b';
      case 'resolved': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active': return 'ACTIVE';
      case 'investigating': return 'INVESTIGATING';
      case 'resolved': return 'RESOLVED';
      default: return 'UNKNOWN';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  return (
    <div className="alerts-page">
      <div className="alerts-header">
        <div className="header-content">
          <h2>Community Security & Reporting</h2>
          <p>Report incidents anonymously and access emergency services</p>
        </div>
      </div>

      {/* Quick Action Cards */}
      <div className="quick-actions">
        {securityAlerts.map(alert => (
          <div key={alert.id} className="action-card">
            <div className="action-icon" style={{ backgroundColor: alert.color }}>
              <FontAwesomeIcon icon={alert.icon} />
            </div>
            <div className="action-content">
              <h3>{alert.title}</h3>
              <p>{alert.description}</p>
            </div>
            <button 
              className="action-btn"
              style={{ backgroundColor: alert.color }}
            >
              {alert.action}
            </button>
          </div>
        ))}
      </div>

      {/* Community Reports Section */}
      <div className="reports-section">
        <h3>Recent Community Reports</h3>
        <p>Stay informed about security incidents in your area</p>
        
        <div className="reports-list">
          {communityReports.map(report => (
            <div key={report.id} className="report-card">
              <div className="report-header">
                <div className="report-type">
                  <FontAwesomeIcon 
                    icon={report.type === 'equipment' ? faTractor : 
                          report.type === 'crop' ? faSeedling : faEye} 
                  />
                  <span>{report.title}</span>
                </div>
                <div 
                  className="report-status"
                  style={{ 
                    backgroundColor: getStatusColor(report.status),
                    color: '#fff'
                  }}
                >
                  {getStatusText(report.status)}
                </div>
              </div>
              
              <p className="report-description">{report.description}</p>
              
              <div className="report-meta">
                <div className="report-location">
                  <FontAwesomeIcon icon={faMapMarkerAlt} />
                  <span>{report.location}</span>
                </div>
                <div className="report-time">
                  <FontAwesomeIcon icon={faClock} />
                  <span>{report.timeAgo}</span>
                </div>
                {report.anonymous && (
                  <div className="anonymous-badge">
                    Anonymous
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Emergency Contacts */}
      <div className="emergency-contacts">
        <h3>Emergency Contacts</h3>
        <p>Quick access to local security and emergency services</p>
        
        <div className="contacts-grid">
          {emergencyContacts.map(contact => (
            <div key={contact.id} className="contact-card">
              <div className="contact-header">
                <div className="contact-icon" style={{ backgroundColor: contact.color }}>
                  <FontAwesomeIcon icon={contact.icon} />
                </div>
                <div className="contact-info">
                  <h4>{contact.name}</h4>
                  <p>{contact.type}</p>
                </div>
              </div>
              
              <div className="contact-number">
                <FontAwesomeIcon icon={faPhoneAlt} />
                <span>{contact.number}</span>
              </div>
              
              <div className="contact-actions">
                <button 
                  className={`call-btn ${contact.available ? 'available' : 'unavailable'}`}
                  disabled={!contact.available}
                >
                  <FontAwesomeIcon icon={faPhoneAlt} />
                  {contact.available ? 'Call' : 'Unavailable'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Farm Security Tips */}
      <div className="security-tips">
        <h3>Farm Security Tips</h3>
        
        <div className="tips-list">
          {farmSecurityTips.map(tip => (
            <div key={tip.id} className="tip-card">
              <div className="tip-icon" style={{ color: getPriorityColor(tip.priority) }}>
                <FontAwesomeIcon icon={tip.icon} />
              </div>
              <div className="tip-content">
                <h4>{tip.title}</h4>
                <p>{tip.description}</p>
              </div>
              <div 
                className="tip-priority"
                style={{ color: getPriorityColor(tip.priority) }}
              >
                {tip.priority.toUpperCase()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Alerts;