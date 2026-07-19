/**
 * Top bar shared across the employee app: a left navigation action, the
 * screen title, and the profile avatar (which opens a popover with My
 * Profile and Sign out).
 *
 * The hub screens (Home, My Rides) show the hamburger menu, which opens the
 * left-side navigation drawer for jumping between Home / Find a Ride /
 * Offer a Ride / My Rides. Screens pushed on top of those (ride detail,
 * ongoing ride, profile) show a back arrow instead. Find/Offer Ride are
 * presented as popup sheets with their own close button, so they don't use
 * this header at all.
 *
 * The drawer and its backdrop are rendered as siblings of <header>, not
 * inside it — nesting a fixed, fully-opaque panel inside an ancestor that
 * has `backdrop-blur` causes it to render translucent in some WebKit
 * browsers, letting the screen behind bleed through.
 */

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  X,
  Menu,
  LogOut,
  UserRound,
  Monitor,
} from "lucide-react";

import { useEmployeeAuthentication } from "../authentication_state/EmployeeAuthenticationContext";
import { EMPLOYEE_NAVIGATION_ITEMS } from "./employee_navigation_items";
import { usePlatformExperience } from "./PlatformExperienceContext";
import { RaahiBrandLockup } from "../branding/RaahiBrandLockup";

export type EmployeeAppHeaderLeftAction = "menu" | "back" | "close";

interface EmployeeAppHeaderProps {
  title: string;
  leftAction?: EmployeeAppHeaderLeftAction;
  onLeftAction?: () => void;
}

const DRAWER_NAVIGATION_ITEMS = EMPLOYEE_NAVIGATION_ITEMS;

export function EmployeeAppHeader({
  title,
  leftAction = "back",
  onLeftAction,
}: EmployeeAppHeaderProps) {
  const navigate = useNavigate();
  const { session, signOut } = useEmployeeAuthentication();
  const { platform, mode, setMode } = usePlatformExperience();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // In the desktop layout the persistent sidebar already provides navigation,
  // so the header's hamburger is hidden to avoid a redundant second menu.
  const isDesktopChrome = mode === "desktop";
  const showMenuButton = leftAction === "menu" && !isDesktopChrome;

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

  function handleLeftActionClick() {
    if (onLeftAction) {
      onLeftAction();
      return;
    }
    if (leftAction === "menu") {
      setIsDrawerOpen(true);
      return;
    }
    if (leftAction === "close") {
      navigate("/home");
      return;
    }
    navigate(-1);
  }

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-[color:var(--color-border-primary)] bg-white/95 px-4 py-3 backdrop-blur">
        {leftAction === "menu" && !showMenuButton ? (
          <span className="h-8 w-8" aria-hidden />
        ) : (
          <button
            type="button"
            onClick={handleLeftActionClick}
            className="rounded-lg p-1 text-text-primary hover:bg-surface-secondary"
            aria-label={
              leftAction === "menu"
                ? "Open menu"
                : leftAction === "close"
                  ? "Close"
                  : "Go back"
            }
          >
            {leftAction === "menu" && <Menu size={22} />}
            {leftAction === "back" && <ArrowLeft size={22} />}
            {leftAction === "close" && <X size={22} />}
          </button>
        )}
        {title === "Raahi" ? <RaahiBrandLockup compact /> : <h1 className="text-base font-bold">{title}</h1>}
        <div className="flex items-center gap-1">
          {platform === "desktop" && !isDesktopChrome && (
            <button
              type="button"
              onClick={() => setMode("desktop")}
              className="rounded-lg p-1.5 text-text-secondary hover:bg-surface-secondary"
              aria-label="Switch to desktop view"
              title="Switch to desktop view"
            >
              <Monitor size={18} />
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsProfileOpen((current) => !current)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-raahi-600 text-xs font-bold text-white"
            aria-label="Profile"
          >
            {initials}
          </button>
        </div>

        {isProfileOpen && (
          <>
            <div
              className="fixed inset-0 z-30"
              onClick={() => setIsProfileOpen(false)}
              aria-hidden
            />
            <div className="absolute right-4 top-14 z-40 w-56 rounded-2xl border border-[color:var(--color-border-primary)] bg-white p-3 shadow-xl">
              <p className="text-sm font-semibold">{session?.fullName}</p>
              <p className="mb-2 truncate text-xs text-text-muted">
                {session?.email}
              </p>
              <button
                type="button"
                onClick={() => {
                  setIsProfileOpen(false);
                  navigate("/profile");
                }}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm hover:bg-surface-secondary"
              >
                <UserRound size={16} /> My Profile
              </button>
              <button
                type="button"
                onClick={handleSignOut}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-rose-500 hover:bg-surface-secondary"
              >
                <LogOut size={16} /> Sign out
              </button>
            </div>
          </>
        )}
      </header>

      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-center">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setIsDrawerOpen(false)}
            aria-hidden
          />
          {/* Pin the drawer to the left edge of the centered phone-width
              column, not the full browser window, so it stays attached to
              the app frame on wide screens. */}
          <div className="relative h-full w-full max-w-[480px]">
            <nav
              className="animate-fade-in absolute inset-y-0 left-0 flex w-72 max-w-[80%] flex-col overflow-y-auto p-4 shadow-2xl"
              style={{ backgroundColor: "#ffffff" }}
            >
              <div className="mb-6 flex items-center justify-between">
                <RaahiBrandLockup />
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(false)}
                  aria-label="Close menu"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="flex flex-col gap-1">
                {DRAWER_NAVIGATION_ITEMS.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setIsDrawerOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium hover:bg-surface-secondary"
                  >
                    <item.icon size={18} className="text-raahi-600" />
                    {item.label}
                  </Link>
                ))}
              </div>
              <button
                type="button"
                onClick={handleSignOut}
                className="mt-auto flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-rose-500 hover:bg-surface-secondary"
              >
                <LogOut size={18} /> Sign out
              </button>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
