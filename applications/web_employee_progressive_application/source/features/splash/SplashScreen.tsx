/**
 * Splash screen shown on launch. A branded placeholder (the final splash art
 * will be supplied later) that routes onward once the session is known.
 */

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { useEmployeeAuthentication } from "../../shared_user_interface_infrastructure/authentication_state/EmployeeAuthenticationContext";
import { RaahiBrandLockup } from "../../shared_user_interface_infrastructure/branding/RaahiBrandLockup";

export function SplashScreen() {
  const navigate = useNavigate();
  const { isAuthenticated, session } = useEmployeeAuthentication();

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      if (!isAuthenticated) {
        navigate("/login", { replace: true });
      } else if (session?.mustChangePassword) {
        navigate("/change-password", { replace: true });
      } else {
        navigate("/home", { replace: true });
      }
    }, 1200);
    return () => window.clearTimeout(timeoutId);
  }, [isAuthenticated, session, navigate]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-raahi-600 text-white">
      <RaahiBrandLockup inverse />
      <p className="text-sm text-white/80">Share the ride. Share the road.</p>
      {/* Splash artwork placeholder — final asset to be provided. */}
    </div>
  );
}
