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
      </Route>

      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
}
