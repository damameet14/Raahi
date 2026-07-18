/** Route guard: allows access only to an authenticated employee. */

import { Navigate, Outlet } from "react-router-dom";

import { useEmployeeAuthentication } from "../authentication_state/EmployeeAuthenticationContext";

export function RequireAuthenticatedEmployee() {
  const { isAuthenticated } = useEmployeeAuthentication();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}
