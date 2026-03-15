import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import SuperAdminRoute from './SuperAdminRoute';
import LoginPage from '../modules/auth/LoginPage';
import DashboardPage from '../modules/dashboard/DashboardPage';
import TenantsListPage from '../modules/tenants/TenantsListPage';
import TenantFormPage from '../modules/tenants/TenantFormPage';
import TenantEditPage from '../modules/tenants/TenantEditPage';
import TenantDashboardPage from '../modules/tenants/TenantDashboardPage';
import CustomersListPage from '../modules/customers/CustomersListPage';
import CustomerFormPage from '../modules/customers/CustomerFormPage';
import CustomerEditPage from '../modules/customers/CustomerEditPage';
import ProjekteListPage from '../modules/projekte/ProjekteListPage';
import MitarbeiterListPage from '../modules/mitarbeiter/MitarbeiterListPage';
import MitarbeiterFormPage from '../modules/mitarbeiter/MitarbeiterFormPage';
import MitarbeiterEditPage from '../modules/mitarbeiter/MitarbeiterEditPage';
import FuhrparkListPage from '../modules/fuhrpark/FuhrparkListPage';
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
        <Route path="mandanten/:id" element={<TenantDashboardPage />} />
        <Route path="mandanten/:id/bearbeiten" element={<TenantEditPage />} />
        <Route path="kunden" element={<CustomersListPage />} />
        <Route path="kunden/neu" element={<CustomerFormPage />} />
        <Route path="kunden/:id" element={<CustomerEditPage />} />
        <Route path="projekte" element={<ProjekteListPage />} />
        <Route path="mitarbeiter" element={<MitarbeiterListPage />} />
        <Route path="mitarbeiter/neu" element={<MitarbeiterFormPage />} />
        <Route path="mitarbeiter/:id/bearbeiten" element={<MitarbeiterEditPage />} />
        <Route path="fuhrpark" element={<FuhrparkListPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
};

export default AppRouter;

