import axios from 'axios';

// Network status detection
const isOnline = () => navigator.onLine;

// Create axios instance with default config
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || (
    process.env.NODE_ENV === 'production' 
      ? '/api'  // Use relative path in production
      : 'http://localhost:5000/api'
  ),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Check network status before making request
    if (!isOnline()) {
      return Promise.reject(new Error('Network Error: You appear to be offline'));
    }
    
    // Add auth token if available
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add debug logging in development
    if (process.env.REACT_APP_DEBUG === 'true') {
      console.log(`🌐 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    // Add debug logging in development
    if (process.env.REACT_APP_DEBUG === 'true') {
      console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`, response.data);
    }
    return response.data;
  },
  (error) => {
    // Enhanced error handling
    let message = 'Something went wrong';
    
    if (!isOnline()) {
      message = 'Network Error: Please check your internet connection';
    } else if (error.code === 'ECONNABORTED') {
      message = 'Network Error: Request timeout - server may be unavailable';
    } else if (error.code === 'ERR_NETWORK') {
      message = 'Network Error: Cannot connect to server';
    } else if (error.response) {
      // Server responded with error status
      message = error.response.data?.message || `Server Error: ${error.response.status}`;
    } else if (error.request) {
      // Request was made but no response received
      message = 'Network Error: Server is not responding';
    } else {
      // Something else happened
      message = error.message || 'Unknown error occurred';
    }
    
    // Add debug logging in development
    if (process.env.REACT_APP_DEBUG === 'true') {
      console.error(`❌ API Error:`, error);
    }
    
    return Promise.reject(new Error(message));
  }
);

// Network status helper functions
export const networkUtils = {
  isOnline,
  checkServerHealth: async () => {
    try {
      const response = await api.get('/health');
      return { online: true, data: response };
    } catch (error) {
      return { online: false, error: error.message };
    }
  }
};

// API endpoints
export const farmAPI = {
  getAll: () => api.get('/farms'),
  getById: (id) => api.get(`/farms/${id}`),
  create: (data) => api.post('/farms', data),
  update: (id, data) => api.put(`/farms/${id}`, data),
  delete: (id) => api.delete(`/farms/${id}`),
  getStats: (id) => api.get(`/farms/${id}/stats`)
};

export const cropAPI = {
  getAll: (params = {}) => api.get('/crops', { params }),
  getById: (id) => api.get(`/crops/${id}`),
  create: (data) => api.post('/crops', data),
  update: (id, data) => api.put(`/crops/${id}`, data),
  delete: (id) => api.delete(`/crops/${id}`),
  updateGrowthStage: (id, data) => api.put(`/crops/${id}/growth-stage`, data),
  addIrrigation: (id, data) => api.post(`/crops/${id}/irrigation`, data),
  addFertilizer: (id, data) => api.post(`/crops/${id}/fertilizers`, data),
  addPesticide: (id, data) => api.post(`/crops/${id}/pesticides`, data)
};

export const sensorAPI = {
  getAll: (params = {}) => api.get('/sensors', { params }),
  getById: (id) => api.get(`/sensors/${id}`),
  create: (data) => api.post('/sensors', data),
  update: (id, data) => api.put(`/sensors/${id}`, data),
  delete: (id) => api.delete(`/sensors/${id}`),
  getData: (id, params = {}) => api.get(`/sensors/${id}/data`, { params }),
  addData: (id, data) => api.post(`/sensors/${id}/data`, data),
  getAnalytics: (id, params = {}) => api.get(`/sensors/${id}/analytics`, { params })
};

export const weatherAPI = {
  getAll: (params = {}) => api.get('/weather', { params }),
  getById: (id) => api.get(`/weather/${id}`),
  create: (data) => api.post('/weather', data),
  update: (id, data) => api.put(`/weather/${id}`, data),
  delete: (id) => api.delete(`/weather/${id}`),
  getCurrentByFarm: (farmId) => api.get(`/weather/farm/${farmId}/current`),
  getForecastByFarm: (farmId, params = {}) => api.get(`/weather/farm/${farmId}/forecast`, { params })
};

export const alertAPI = {
  getAll: (params = {}) => api.get('/alerts', { params }),
  getById: (id) => api.get(`/alerts/${id}`),
  create: (data) => api.post('/alerts', data),
  update: (id, data) => api.put(`/alerts/${id}`, data),
  delete: (id) => api.delete(`/alerts/${id}`),
  acknowledge: (id, data) => api.put(`/alerts/${id}/acknowledge`, data),
  resolve: (id, data) => api.put(`/alerts/${id}/resolve`, data),
  getStats: (params = {}) => api.get('/alerts/stats/summary', { params })
};

export const analyticsAPI = {
  getDashboard: (params = {}) => api.get('/analytics/dashboard', { params }),
  getYield: (params = {}) => api.get('/analytics/yield', { params }),
  getWeatherImpact: (params = {}) => api.get('/analytics/weather-impact', { params }),
  getResourceUsage: (params = {}) => api.get('/analytics/resource-usage', { params }),
  getTrends: (params = {}) => api.get('/analytics/trends', { params })
};

// Crop Price API endpoints
export const cropPriceAPI = {
  getAll: (params = {}) => api.get('/crop-prices', { params }),
  getFeatured: () => api.get('/crop-prices/featured'),
  getAnalytics: (params = {}) => api.get('/crop-prices/analytics', { params }),
  getPredictions: (params = {}) => api.get('/crop-prices/predictions', { params }),
  getMarketAnalysis: (params = {}) => api.get('/crop-prices/market-analysis', { params }),
  getTrends: (params = {}) => api.get('/crop-prices/trends', { params }),
  getMarketComparison: (params = {}) => api.get('/crop-prices/markets/comparison', { params }),
  getById: (id) => api.get(`/crop-prices/${id}`),
  create: (data) => api.post('/crop-prices', data),
  update: (id, data) => api.put(`/crop-prices/${id}`, data),
  delete: (id) => api.delete(`/crop-prices/${id}`)
};

export default api;
