import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard/Dashboard';
import Crops from './pages/Crops/Crops';
import CropPrices from './pages/CropPrices/CropPrices';
import Weather from './pages/Weather/Weather';
import Alerts from './pages/Alerts/Alerts';
import FarmingTips from './pages/FarmingTips/FarmingTips';
import Training from './pages/Training/Training';
import './assets/css/globals.css';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/crops" element={<Crops />} />
          <Route path="/crop-prices" element={<CropPrices />} />
          <Route path="/weather" element={<Weather />} />
          <Route path="/farming-tips" element={<FarmingTips />} />
          <Route path="/training" element={<Training />} />
          <Route path="/alerts" element={<Alerts />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
