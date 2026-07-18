/**
 * Application router configuration.
 *
 * Defines all routes including protected admin pages
 * and public login page.
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRouteGuard } from './shared_user_interface_infrastructure/protected_route/ProtectedRouteGuard';
import { AdministrationPortalLayout } from './shared_user_interface_infrastructure/layout/AdministrationPortalLayout';
import { AdministratorLoginPage } from './features/administrator_login/AdministratorLoginPage';
import { DashboardOverviewPage } from './features/dashboard_overview/DashboardOverviewPage';
import { EmployeeListPage } from './features/employee_management/EmployeeListPage';
import { VehicleListPage } from './features/vehicle_management/VehicleListPage';
import { ReportsOverviewPage } from './features/reports_and_analytics/ReportsOverviewPage';
import { CompanySettingsPage } from './features/company_settings/CompanySettingsPage';
import { AdministratorProfilePage } from './features/administrator_profile/AdministratorProfilePage';

export function ApplicationRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<AdministratorLoginPage />} />

        {/* Protected admin routes */}
        <Route element={<ProtectedRouteGuard />}>
          <Route element={<AdministrationPortalLayout />}>
            <Route path="/dashboard" element={<DashboardOverviewPage />} />
            <Route path="/employees" element={<EmployeeListPage />} />
            <Route path="/vehicles" element={<VehicleListPage />} />
            <Route path="/reports" element={<ReportsOverviewPage />} />
            <Route path="/settings" element={<CompanySettingsPage />} />
            <Route path="/profile" element={<AdministratorProfilePage />} />
          </Route>
        </Route>

        {/* Default redirect */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
