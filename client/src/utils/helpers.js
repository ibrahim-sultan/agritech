import { format, formatDistanceToNow, isValid, parseISO } from 'date-fns';

// Date formatting utilities
export const formatDate = (date, formatString = 'MMM dd, yyyy') => {
  if (!date) return '';
  
  const parsedDate = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(parsedDate)) return '';
  
  return format(parsedDate, formatString);
};

export const formatRelativeTime = (date) => {
  if (!date) return '';
  
  const parsedDate = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(parsedDate)) return '';
  
  return formatDistanceToNow(parsedDate, { addSuffix: true });
};

// Number formatting utilities
export const formatNumber = (number, decimals = 0) => {
  if (typeof number !== 'number') return '0';
  return number.toFixed(decimals);
};

export const formatPercentage = (value, total) => {
  if (!total || total === 0) return '0%';
  return `${((value / total) * 100).toFixed(1)}%`;
};

export const formatCurrency = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

// Text utilities
export const capitalizeFirst = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const truncateText = (text, maxLength = 100) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substr(0, maxLength) + '...';
};

export const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
};

// Status utilities
export const getStatusColor = (status) => {
  const statusColors = {
    active: 'var(--success)',
    inactive: 'var(--gray-400)',
    warning: 'var(--warning)',
    error: 'var(--error)',
    success: 'var(--success)',
    pending: 'var(--warning)',
    completed: 'var(--success)',
    failed: 'var(--error)',
    critical: 'var(--error)',
    high: 'var(--warning)',
    medium: 'var(--info)',
    low: 'var(--gray-400)'
  };
  
  return statusColors[status?.toLowerCase()] || 'var(--gray-400)';
};

export const getHealthColor = (score) => {
  if (score >= 90) return 'var(--success)';
  if (score >= 70) return 'var(--warning)';
  if (score >= 50) return 'var(--accent)';
  return 'var(--error)';
};

// Validation utilities
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPhone = (phone) => {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
};

// Array utilities
export const sortBy = (array, key, direction = 'asc') => {
  return [...array].sort((a, b) => {
    const aVal = key.includes('.') ? getNestedValue(a, key) : a[key];
    const bVal = key.includes('.') ? getNestedValue(b, key) : b[key];
    
    if (direction === 'asc') {
      return aVal > bVal ? 1 : -1;
    } else {
      return aVal < bVal ? 1 : -1;
    }
  });
};

export const groupBy = (array, key) => {
  return array.reduce((groups, item) => {
    const value = key.includes('.') ? getNestedValue(item, key) : item[key];
    groups[value] = groups[value] || [];
    groups[value].push(item);
    return groups;
  }, {});
};

export const getNestedValue = (obj, path) => {
  return path.split('.').reduce((o, p) => o && o[p], obj);
};

// Color utilities
export const generateRandomColor = () => {
  const colors = [
    '#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6',
    '#06b6d4', '#f97316', '#84cc16', '#ec4899', '#6366f1'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

export const hexToRgba = (hex, alpha = 1) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// Local storage utilities
export const storage = {
  get: (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  },
  
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  },
  
  remove: (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  },
  
  clear: () => {
    try {
      localStorage.clear();
      return true;
    } catch {
      return false;
    }
  }
};

// Debounce utility
export const debounce = (func, wait, immediate) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func(...args);
  };
};

// Chart data utilities
export const generateChartData = (data, labelKey, valueKey, backgroundColor, borderColor) => {
  return {
    labels: data.map(item => getNestedValue(item, labelKey) || item[labelKey]),
    datasets: [{
      data: data.map(item => getNestedValue(item, valueKey) || item[valueKey]),
      backgroundColor: backgroundColor || generateRandomColor(),
      borderColor: borderColor || generateRandomColor(),
      borderWidth: 2
    }]
  };
};

// Weather utilities
export const getWeatherIcon = (condition) => {
  const icons = {
    sunny: '☀️',
    cloudy: '☁️',
    partly_cloudy: '⛅',
    overcast: '☁️',
    rainy: '🌧️',
    stormy: '⛈️',
    foggy: '🌫️',
    snowy: '❄️'
  };
  
  return icons[condition] || '🌤️';
};

export const getWindDirection = (direction) => {
  const directions = {
    N: 'North',
    NE: 'Northeast',
    E: 'East',
    SE: 'Southeast',
    S: 'South',
    SW: 'Southwest',
    W: 'West',
    NW: 'Northwest'
  };
  
  return directions[direction] || direction;
};
