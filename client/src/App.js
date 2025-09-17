import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout/Layout';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Dashboard from './pages/Dashboard/Dashboard';
import DashboardRouter from './pages/Dashboard/DashboardRouter';
import Crops from './pages/Crops/Crops';
import CropPrices from './pages/CropPrices/CropPrices';
import Weather from './pages/Weather/Weather';
import Alerts from './pages/Alerts/Alerts';
import FarmingTips from './pages/FarmingTips/FarmingTips';
import Training from './pages/Training/Training';
import './assets/css/globals.css';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// App Routes Component
const AppRoutes = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Layout>
      <Routes>
        {/* Public routes */}
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />}
        />
        <Route
          path="/register"
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Register />}
        />

        {/* Protected routes */}
        <Route
          path="/"
          element={<Navigate to="/dashboard" replace />}
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardRouter />
            </ProtectedRoute>
          }
        />
        <Route
          path="/crops"
          element={
            <ProtectedRoute>
              <Crops />
            </ProtectedRoute>
          }
        />
        <Route
          path="/crop-prices"
          element={
            <ProtectedRoute>
              <CropPrices />
            </ProtectedRoute>
          }
        />
        <Route
          path="/weather"
          element={
            <ProtectedRoute>
              <Weather />
            </ProtectedRoute>
          }
        />
        <Route
          path="/farming-tips"
          element={
            <ProtectedRoute>
              <FarmingTips />
            </ProtectedRoute>
          }
        />
        <Route
          path="/training"
          element={
            <ProtectedRoute>
              <Training />
            </ProtectedRoute>
          }
        />
        <Route
          path="/alerts"
          element={
            <ProtectedRoute>
              <Alerts />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Layout>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
