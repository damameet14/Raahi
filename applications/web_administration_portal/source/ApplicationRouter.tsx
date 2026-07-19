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
import { OrganizationRegistrationPage } from './features/organization_registration/OrganizationRegistrationPage';
import { RequiredPasswordChangePage } from './features/required_password_change/RequiredPasswordChangePage';
import { DashboardOverviewPage } from './features/dashboard_overview/DashboardOverviewPage';
import { EmployeeListPage } from './features/employee_management/EmployeeListPage';
import { VehicleListPage } from './features/vehicle_management/VehicleListPage';
import { ReportsOverviewPage } from './features/reports_and_analytics/ReportsOverviewPage';
import { CompanySettingsPage } from './features/company_settings/CompanySettingsPage';
import { AdministratorProfilePage } from './features/administrator_profile/AdministratorProfilePage';
import { OnboardingRequestsPage } from './features/platform_onboarding/OnboardingRequestsPage';

export function ApplicationRouter() {
  return (
    <BrowserRouter basename="/admin">
      <Routes>
        {/* Public routes. The marketing landing is the static site served at the
            top-level "/"; the admin portal root simply forwards to the login. */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/register-organization" element={<OrganizationRegistrationPage />} />
        <Route path="/login" element={<AdministratorLoginPage />} />

        {/* Protected admin routes */}
        <Route element={<ProtectedRouteGuard />}>
          <Route element={<AdministrationPortalLayout />}>
            <Route path="/platform/onboarding" element={<OnboardingRequestsPage />} />
            <Route path="/dashboard" element={<DashboardOverviewPage />} />
            <Route path="/employees" element={<EmployeeListPage />} />
            <Route path="/vehicles" element={<VehicleListPage />} />
            <Route path="/reports" element={<ReportsOverviewPage />} />
            <Route path="/settings" element={<CompanySettingsPage />} />
            <Route path="/profile" element={<AdministratorProfilePage />} />
            <Route path="/change-password" element={<RequiredPasswordChangePage />} />
          </Route>
        </Route>

        {/* Default redirect */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
