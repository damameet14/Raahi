/**
 * Protected route guard component.
 *
 * Redirects unauthenticated users to the login page.
 */

import { Navigate, Outlet } from 'react-router-dom';
import { useAuthenticatedUser } from '../authentication_state/AuthenticationContextProvider';

export function ProtectedRouteGuard() {
  const { isAuthenticated } = useAuthenticatedUser();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
