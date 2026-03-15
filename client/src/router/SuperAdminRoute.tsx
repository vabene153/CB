import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const SuperAdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  if (!user?.isSuperAdmin) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

export default SuperAdminRoute;
