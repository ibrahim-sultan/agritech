import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import FarmerDashboard from './FarmerDashboard';
import AdminDashboard from './AdminDashboard';
import ExpertDashboard from './ExpertDashboard';

const DashboardRouter = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="modern-dashboard loading">
        <div className="loading-spinner">⏳</div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  // Route to appropriate dashboard based on user role
  switch (user.role) {
    case 'admin':
      return <AdminDashboard />;
    case 'expert':
      return <ExpertDashboard />;
    case 'farmer':
    default:
      return <FarmerDashboard />;
  }
};

export default DashboardRouter;
