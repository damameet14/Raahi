/**
 * Authentication state context and provider.
 *
 * Manages the authenticated user state in React context,
 * persisting tokens and user data to localStorage.
 */

import React, { createContext, useContext, useState, useCallback } from 'react';

interface AuthenticatedUserData {
  userAccountId: string;
  email: string;
  fullName: string;
  role: string;
  organizationId: string;
  mustChangePassword: boolean;
}

interface AuthenticationContextValue {
  isAuthenticated: boolean;
  authenticatedUser: AuthenticatedUserData | null;
  accessToken: string | null;
  storeAuthenticationTokens: (
    accessToken: string,
    refreshToken: string,
    userData: AuthenticatedUserData
  ) => void;
  markPasswordChangeCompleted: () => void;
  clearAuthenticationState: () => void;
}

const AuthenticationContext = createContext<AuthenticationContextValue | null>(null);

export function AuthenticationContextProvider({ children }: { children: React.ReactNode }) {
  const [authenticatedUser, setAuthenticatedUser] = useState<AuthenticatedUserData | null>(() => {
    const storedUser = localStorage.getItem('raahi_user');
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const [accessToken, setAccessToken] = useState<string | null>(
    () => localStorage.getItem('raahi_access_token')
  );

  const storeAuthenticationTokens = useCallback(
    (newAccessToken: string, newRefreshToken: string, userData: AuthenticatedUserData) => {
      localStorage.setItem('raahi_access_token', newAccessToken);
      localStorage.setItem('raahi_refresh_token', newRefreshToken);
      localStorage.setItem('raahi_user', JSON.stringify(userData));
      setAccessToken(newAccessToken);
      setAuthenticatedUser(userData);
    },
    []
  );

  const clearAuthenticationState = useCallback(() => {
    localStorage.removeItem('raahi_access_token');
    localStorage.removeItem('raahi_refresh_token');
    localStorage.removeItem('raahi_user');
    setAccessToken(null);
    setAuthenticatedUser(null);
  }, []);

  const markPasswordChangeCompleted = useCallback(() => {
    setAuthenticatedUser((currentUser) => {
      if (!currentUser) {
        return currentUser;
      }
      const updatedUser = { ...currentUser, mustChangePassword: false };
      localStorage.setItem('raahi_user', JSON.stringify(updatedUser));
      return updatedUser;
    });
  }, []);

  return (
    <AuthenticationContext.Provider
      value={{
        isAuthenticated: !!accessToken && !!authenticatedUser,
        authenticatedUser,
        accessToken,
        storeAuthenticationTokens,
        markPasswordChangeCompleted,
        clearAuthenticationState,
      }}
    >
      {children}
    </AuthenticationContext.Provider>
  );
}

export function useAuthenticatedUser(): AuthenticationContextValue {
  const context = useContext(AuthenticationContext);
  if (!context) {
    throw new Error('useAuthenticatedUser must be used within AuthenticationContextProvider');
  }
  return context;
}
