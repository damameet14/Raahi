/**
 * Protected route guard component.
 *
 * Redirects unauthenticated users to the login page.
 */

import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthenticatedUser } from '../authentication_state/AuthenticationContextProvider';

export function ProtectedRouteGuard() {
  const location = useLocation();
  const { isAuthenticated, authenticatedUser } = useAuthenticatedUser();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (
    authenticatedUser?.mustChangePassword &&
    location.pathname !== '/change-password'
  ) {
    return <Navigate to="/change-password" replace />;
  }

  return <Outlet />;
}
