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

  // Role-based access: the platform super-admin only sees onboarding review,
  // while company admins never reach the platform routes.
  const isSuperAdmin = authenticatedUser?.role === 'SUPER_ADMIN';
  const currentPath = location.pathname;
  const sharedPaths = ['/change-password', '/profile'];

  if (isSuperAdmin) {
    const isAllowedForSuperAdmin =
      currentPath.startsWith('/platform') || sharedPaths.includes(currentPath);
    if (!isAllowedForSuperAdmin) {
      return <Navigate to="/platform/onboarding" replace />;
    }
  } else if (currentPath.startsWith('/platform')) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
