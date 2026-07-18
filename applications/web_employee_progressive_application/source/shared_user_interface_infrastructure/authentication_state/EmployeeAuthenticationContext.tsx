/**
 * Employee session state held in React context and mirrored to localStorage.
 * Tracks whether the employee must still change their first-login password so
 * routing can force that step before anything else.
 */

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

import {
  EMPLOYEE_ACCESS_TOKEN_STORAGE_KEY,
  EMPLOYEE_REFRESH_TOKEN_STORAGE_KEY,
  EMPLOYEE_SESSION_STORAGE_KEY,
  clearEmployeeSession,
} from "../backend_communication/employee_api_client";
import type { AuthenticationTokensResponse } from "../backend_communication/employee_api_types";

interface EmployeeSession {
  userAccountId: string;
  email: string;
  fullName: string;
  organizationId: string;
  mustChangePassword: boolean;
}

interface EmployeeAuthenticationContextValue {
  isAuthenticated: boolean;
  session: EmployeeSession | null;
  storeSession: (tokens: AuthenticationTokensResponse) => void;
  markPasswordChanged: () => void;
  signOut: () => void;
}

const EmployeeAuthenticationContext =
  createContext<EmployeeAuthenticationContextValue | null>(null);

function readStoredSession(): EmployeeSession | null {
  const storedSession = localStorage.getItem(EMPLOYEE_SESSION_STORAGE_KEY);
  return storedSession ? (JSON.parse(storedSession) as EmployeeSession) : null;
}

export function EmployeeAuthenticationProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [session, setSession] = useState<EmployeeSession | null>(readStoredSession);
  const [accessToken, setAccessToken] = useState<string | null>(() =>
    localStorage.getItem(EMPLOYEE_ACCESS_TOKEN_STORAGE_KEY),
  );

  const storeSession = useCallback((tokens: AuthenticationTokensResponse) => {
    const nextSession: EmployeeSession = {
      userAccountId: tokens.user_account_id,
      email: tokens.email,
      fullName: tokens.full_name,
      organizationId: tokens.organization_id,
      mustChangePassword: tokens.must_change_password,
    };
    localStorage.setItem(EMPLOYEE_ACCESS_TOKEN_STORAGE_KEY, tokens.access_token);
    localStorage.setItem(
      EMPLOYEE_REFRESH_TOKEN_STORAGE_KEY,
      tokens.refresh_token,
    );
    localStorage.setItem(
      EMPLOYEE_SESSION_STORAGE_KEY,
      JSON.stringify(nextSession),
    );
    setAccessToken(tokens.access_token);
    setSession(nextSession);
  }, []);

  const markPasswordChanged = useCallback(() => {
    setSession((currentSession) => {
      if (!currentSession) {
        return currentSession;
      }
      const updatedSession = { ...currentSession, mustChangePassword: false };
      localStorage.setItem(
        EMPLOYEE_SESSION_STORAGE_KEY,
        JSON.stringify(updatedSession),
      );
      return updatedSession;
    });
  }, []);

  const signOut = useCallback(() => {
    clearEmployeeSession();
    setAccessToken(null);
    setSession(null);
  }, []);

  return (
    <EmployeeAuthenticationContext.Provider
      value={{
        isAuthenticated: Boolean(accessToken && session),
        session,
        storeSession,
        markPasswordChanged,
        signOut,
      }}
    >
      {children}
    </EmployeeAuthenticationContext.Provider>
  );
}

export function useEmployeeAuthentication(): EmployeeAuthenticationContextValue {
  const context = useContext(EmployeeAuthenticationContext);
  if (!context) {
    throw new Error(
      "useEmployeeAuthentication must be used within EmployeeAuthenticationProvider",
    );
  }
  return context;
}
