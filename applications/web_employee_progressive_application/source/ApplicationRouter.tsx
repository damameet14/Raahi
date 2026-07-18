/** Route map for the employee application. */

import { Navigate, Route, Routes } from "react-router-dom";

import { RequireAuthenticatedEmployee } from "./shared_user_interface_infrastructure/protected_route/RequireAuthenticatedEmployee";
import { RequireReadyEmployee } from "./shared_user_interface_infrastructure/protected_route/RequireReadyEmployee";
import { SplashScreen } from "./features/splash/SplashScreen";
import { EmployeeLoginPage } from "./features/employee_login/EmployeeLoginPage";
import { RequiredPasswordChangePage } from "./features/required_password_change/RequiredPasswordChangePage";
import { EmployeeOnboardingPage } from "./features/employee_onboarding/EmployeeOnboardingPage";
import { HomePage } from "./features/home_dashboard/HomePage";
import { FindRidePage } from "./features/find_ride/FindRidePage";
import { OfferRidePage } from "./features/offer_ride/OfferRidePage";
import { RidesOverviewPage } from "./features/rides_overview/RidesOverviewPage";
import { UpcomingRideDetailPage } from "./features/upcoming_rides/UpcomingRideDetailPage";
import { OngoingRidePage } from "./features/ongoing_ride/OngoingRidePage";
import { ProfileManagementPage } from "./features/profile_management/ProfileManagementPage";
import { VehicleManagementPage } from "./features/vehicle_management/VehicleManagementPage";
import { SavedPlacesPage } from "./features/saved_places/SavedPlacesPage";
import { RideHistoryPage } from "./features/ride_history/RideHistoryPage";
import { EmployeeReportsPage } from "./features/reports_and_analytics/EmployeeReportsPage";
import { IntegrationPlaceholderPage } from "./features/integration_placeholders/IntegrationPlaceholderPage";

export function ApplicationRouter() {
  return (
    <Routes>
      <Route path="/" element={<SplashScreen />} />
      <Route path="/login" element={<EmployeeLoginPage />} />

      <Route element={<RequireAuthenticatedEmployee />}>
        <Route path="/change-password" element={<RequiredPasswordChangePage />} />
        <Route path="/onboarding" element={<EmployeeOnboardingPage />} />
      </Route>

      <Route element={<RequireReadyEmployee />}>
        <Route path="/home" element={<HomePage />} />
        <Route path="/find-ride" element={<FindRidePage />} />
        <Route path="/offer-ride" element={<OfferRidePage />} />
        <Route path="/rides" element={<RidesOverviewPage />} />
        <Route
          path="/rides/upcoming/:rideBookingId"
          element={<UpcomingRideDetailPage />}
        />
        <Route path="/ongoing/:rideBookingId" element={<OngoingRidePage />} />
        <Route path="/profile" element={<ProfileManagementPage />} />
        <Route path="/vehicles" element={<VehicleManagementPage />} />
        <Route path="/saved-places" element={<SavedPlacesPage />} />
        <Route path="/ride-history" element={<RideHistoryPage />} />
        <Route path="/reports" element={<EmployeeReportsPage />} />
        <Route
          path="/payment-methods"
          element={<IntegrationPlaceholderPage kind="payments" />}
        />
        <Route path="/chat" element={<IntegrationPlaceholderPage kind="chat" />} />
      </Route>

      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
}
