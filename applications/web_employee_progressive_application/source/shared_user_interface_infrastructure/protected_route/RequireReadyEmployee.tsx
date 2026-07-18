/**
 * Route guard for the main application. An employee reaches it only after
 * authenticating, changing their first-login password, and completing
 * onboarding — otherwise they are redirected to the outstanding step.
 */

import { Navigate, Outlet } from "react-router-dom";
import { Loader2 } from "lucide-react";

import { useEmployeeAuthentication } from "../authentication_state/EmployeeAuthenticationContext";
import { useEmployeeProfileQuery } from "../employee_profile/useEmployeeProfileQuery";

export function RequireReadyEmployee() {
  const { isAuthenticated, session } = useEmployeeAuthentication();

  const profileQuery = useEmployeeProfileQuery(
    isAuthenticated && !session?.mustChangePassword,
  );

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (session?.mustChangePassword) {
    return <Navigate to="/change-password" replace />;
  }
  if (profileQuery.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="animate-spin text-raahi-600" />
      </div>
    );
  }
  if (profileQuery.data && !profileQuery.data.onboarding_completed) {
    return <Navigate to="/onboarding" replace />;
  }
  return <Outlet />;
}
