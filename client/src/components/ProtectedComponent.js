import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const ProtectedComponent = ({ 
  children, 
  allowedRoles = [], 
  fallback = null,
  showUnauthorized = true 
}) => {
  const { user } = useAuth();

  if (!user) {
    return fallback || (showUnauthorized ? <div>Please log in to access this feature</div> : null);
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return fallback || (showUnauthorized ? <div>You don't have permission to access this feature</div> : null);
  }

  return children;
};

// Higher-order component for role-based access
export const withRoleProtection = (Component, allowedRoles = []) => {
  return (props) => (
    <ProtectedComponent allowedRoles={allowedRoles}>
      <Component {...props} />
    </ProtectedComponent>
  );
};

// Hook to check user permissions
export const usePermissions = () => {
  const { user } = useAuth();

  const hasRole = (role) => user?.role === role;
  const hasAnyRole = (roles) => roles.includes(user?.role);
  const isAdmin = () => user?.role === 'admin';
  const isExpert = () => user?.role === 'expert';
  const isFarmer = () => user?.role === 'farmer';
  const canUpload = () => ['admin', 'expert'].includes(user?.role);
  const canManage = () => user?.role === 'admin';

  return {
    user,
    hasRole,
    hasAnyRole,
    isAdmin,
    isExpert,
    isFarmer,
    canUpload,
    canManage
  };
};

export default ProtectedComponent;
