import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faGraduationCap,
  faComputer,
  faSeedling,
  faShieldAlt,
  faCode,
  faPlay,
  faCheck,
  faClock,
  faUsers,
  faLanguage
} from '@fortawesome/free-solid-svg-icons';
import './Training.css';

const Training = () => {
  const [activeCategory, setActiveCategory] = useState('All Courses');
  const [language, setLanguage] = useState('English');

  const stats = [
    {
      number: '4',
      label: 'Active Courses',
      icon: faGraduationCap,
      color: '#3b82f6'
    },
    {
      number: '1',
      label: 'Completed',
      icon: faCheck,
      color: '#10b981'
    },
    {
      number: '2',
      label: 'In Progress',
      icon: faClock,
      color: '#8b5cf6'
    }
  ];

  const courses = [
    {
      id: 1,
      category: 'Basic Computing',
      title: 'Basic Computer Skills for Farmers',
      description: 'Learn essential computer skills including typing, internet browsing, and using farming apps.',
      instructor: 'Mr. Adebayo',
      duration: '2 hours',
      students: 45,
      difficulty: 'Beginner',
      status: 'available',
      progress: 0,
      icon: faComputer,
      color: '#3b82f6'
    },
    {
      id: 2,
      category: 'Digital Farming',
      title: 'Digital Marketing for Farm Products',
      description: 'Learn how to sell your farm products online using social media and e-commerce platforms.',
      instructor: 'Mrs. Fatima',
      duration: '3 hours',
      students: 32,
      difficulty: 'Intermediate',
      status: 'available',
      progress: 0,
      icon: faSeedling,
      color: '#10b981'
    },
    {
      id: 3,
      category: 'Internet Safety',
      title: 'Internet Safety and Security',
      description: 'Stay safe online: recognize scams, protect personal information, and practice safe browsing.',
      instructor: 'Dr. Kemi',
      duration: '1.5 hours',
      students: 28,
      difficulty: 'Beginner',
      status: 'available',
      progress: 0,
      icon: faShieldAlt,
      color: '#ef4444'
    },
    {
      id: 4,
      category: 'IT Skills',
      title: 'Introduction to Python Programming',
      description: 'Learn basic programming concepts with Python, focusing on agricultural data analysis.',
      instructor: 'Eng. Tunde',
      duration: '5 hours',
      students: 15,
      difficulty: 'Advanced',
      status: 'available',
      progress: 0,
      icon: faCode,
      color: '#f59e0b'
    }
  ];

  const categories = ['All Courses', 'Basic Computing', 'Digital Farming', 'Internet Safety', 'IT Skills'];

  const filteredCourses = activeCategory === 'All Courses' 
    ? courses 
    : courses.filter(course => course.category === activeCategory);

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Beginner': return '#10b981';
      case 'Intermediate': return '#f59e0b';
      case 'Advanced': return '#ef4444';
      default: return '#6b7280';
    }
  };

  return (
    <div className="training-page">
      <div className="training-header">
        <div className="header-content">
          <h2>Youth Training & IT Skills</h2>
          <p>Free courses to build digital skills and modern career opportunities</p>
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

      {/* Stats Cards */}
      <div className="training-stats">
        {stats.map((stat, index) => (
          <div key={index} className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: stat.color }}>
              <FontAwesomeIcon icon={stat.icon} />
            </div>
            <div className="stat-content">
              <h3>{stat.number}</h3>
              <p>{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Learning Progress */}
      <div className="learning-progress">
        <h3>Your Learning Progress</h3>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: '40%' }}></div>
        </div>
        <div className="progress-info">
          <span>Overall Completion</span>
          <span>40%</span>
        </div>
      </div>

      {/* Course Categories */}
      <div className="course-categories">
        {categories.map(category => (
          <button
            key={category}
            className={activeCategory === category ? 'active' : ''}
            onClick={() => setActiveCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Courses Grid */}
      <div className="courses-grid">
        {filteredCourses.map(course => (
          <div key={course.id} className="course-card">
            <div className="course-header">
              <div className="course-icon" style={{ backgroundColor: course.color }}>
                <FontAwesomeIcon icon={course.icon} />
              </div>
              <div className="course-meta">
                <span className="course-category">{course.category}</span>
                <span 
                  className="course-difficulty"
                  style={{ color: getDifficultyColor(course.difficulty) }}
                >
                  {course.difficulty}
                </span>
              </div>
            </div>
            
            <h3 className="course-title">{course.title}</h3>
            <p className="course-description">{course.description}</p>
            
            <div className="course-details">
              <div className="detail-item">
                <FontAwesomeIcon icon={faClock} />
                <span>{course.duration}</span>
              </div>
              <div className="detail-item">
                <FontAwesomeIcon icon={faUsers} />
                <span>{course.students} students</span>
              </div>
            </div>
            
            <div className="course-instructor">
              <span>By {course.instructor}</span>
            </div>
            
            <div className="course-footer">
              <button className="start-course-btn">
                <FontAwesomeIcon icon={faPlay} />
                Start Course
              </button>
              {course.status === 'completed' && (
                <div className="completion-badge">
                  <FontAwesomeIcon icon={faCheck} />
                  Completed
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Training;
