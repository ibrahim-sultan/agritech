import axios from 'axios';

// Create axios instance with default config
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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
    return response.data;
  },
  (error) => {
    const message = error.response?.data?.message || error.message || 'Something went wrong';
    return Promise.reject(new Error(message));
  }
);

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
