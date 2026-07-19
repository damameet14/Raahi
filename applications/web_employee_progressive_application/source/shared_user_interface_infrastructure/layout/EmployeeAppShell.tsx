/**
 * Responsive frame around the whole employee app.
 *
 * - Mobile experience: the app renders in a centered phone-width column
 *   (as designed), and each screen supplies its own header/drawer.
 * - Desktop experience (authenticated screens only): a persistent left
 *   sidebar plus a wider, centered content column, so the app is comfortable
 *   to use on a laptop or monitor.
 *
 * A platform toggle (in the shared header) lets the user switch between the
 * two at any time, and Android users see a PWA install banner on top.
 */

import { type ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { LogOut, Monitor, Smartphone } from "lucide-react";

import { useEmployeeAuthentication } from "../authentication_state/EmployeeAuthenticationContext";
import { EMPLOYEE_NAVIGATION_ITEMS } from "./employee_navigation_items";
import { usePlatformExperience } from "./PlatformExperienceContext";
import { PwaInstallBanner } from "./PwaInstallBanner";

function DesktopSidebar() {
  const navigate = useNavigate();
  const { session, signOut } = useEmployeeAuthentication();
  const { setMode } = usePlatformExperience();

  const initials = (session?.fullName ?? "?")
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  function handleSignOut() {
    signOut();
    navigate("/login", { replace: true });
  }

  return (
    <aside className="employee-desktop-sidebar">
      <div className="flex items-center gap-2 px-2 py-1">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-raahi-600 text-sm font-extrabold text-white">
          R
        </div>
        <span className="text-lg font-extrabold">Raahi</span>
      </div>

      <nav className="mt-6 flex flex-1 flex-col gap-1 overflow-y-auto">
        {EMPLOYEE_NAVIGATION_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                isActive
                  ? "bg-raahi-50 text-raahi-700"
                  : "text-text-secondary hover:bg-surface-secondary hover:text-text-primary"
              }`
            }
          >
            <item.icon size={18} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <button
        type="button"
        onClick={() => setMode("mobile")}
        className="mt-2 flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-text-secondary hover:bg-surface-secondary"
      >
        <Smartphone size={18} /> Switch to mobile view
      </button>

      <div className="mt-2 flex items-center gap-3 border-t border-[color:var(--color-border-primary)] pt-3">
        <button
          type="button"
          onClick={() => navigate("/profile")}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-raahi-600 text-xs font-bold text-white"
          aria-label="My profile"
        >
          {initials}
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{session?.fullName}</p>
          <p className="truncate text-xs text-text-muted">{session?.email}</p>
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          aria-label="Sign out"
          className="rounded-lg p-2 text-rose-500 hover:bg-surface-secondary"
        >
          <LogOut size={18} />
        </button>
      </div>
    </aside>
  );
}

/**
 * Floating control to enter the desktop layout, shown to unauthenticated or
 * mobile-mode desktop users so the wider layout is discoverable.
 */
function EnterDesktopModeButton() {
  const { platform, mode, setMode } = usePlatformExperience();
  if (platform !== "desktop" || mode === "desktop") {
    return null;
  }
  return (
    <button
      type="button"
      onClick={() => setMode("desktop")}
      className="fixed bottom-4 right-4 z-40 flex items-center gap-2 rounded-full bg-raahi-700 px-4 py-2.5 text-sm font-semibold text-white shadow-lg"
    >
      <Monitor size={16} /> Desktop view
    </button>
  );
}

export function EmployeeAppShell({ children }: { children: ReactNode }) {
  const { mode } = usePlatformExperience();
  const { session } = useEmployeeAuthentication();

  const useDesktopChrome = mode === "desktop" && Boolean(session);

  return (
    <>
      <PwaInstallBanner />
      {useDesktopChrome ? (
        <div className="employee-desktop-shell">
          <DesktopSidebar />
          <main className="employee-desktop-main">
            <div className="employee-desktop-content">{children}</div>
          </main>
        </div>
      ) : (
        <>
          <div className="application-viewport">{children}</div>
          <EnterDesktopModeButton />
        </>
      )}
    </>
  );
}
