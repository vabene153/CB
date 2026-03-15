import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import SuperAdminRoute from './SuperAdminRoute';
import LoginPage from '../modules/auth/LoginPage';
import DashboardPage from '../modules/dashboard/DashboardPage';
import TenantsListPage from '../modules/tenants/TenantsListPage';
import TenantFormPage from '../modules/tenants/TenantFormPage';
import TenantEditPage from '../modules/tenants/TenantEditPage';
import MainLayout from '../components/layout/MainLayout';

const AppRouter: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="mandanten" element={<SuperAdminRoute><TenantsListPage /></SuperAdminRoute>} />
        <Route path="mandanten/neu" element={<SuperAdminRoute><TenantFormPage /></SuperAdminRoute>} />
        <Route path="mandanten/:id" element={<SuperAdminRoute><TenantEditPage /></SuperAdminRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
};

export default AppRouter;

