/**
 * Top bar with the navigation-drawer burger (left) and profile menu (right),
 * shared across the main employee screens. Owns the slide-in drawer and the
 * profile popover (which offers sign out).
 */

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X, Home, Search, Car, ListChecks, LogOut } from "lucide-react";

import { useEmployeeAuthentication } from "../authentication_state/EmployeeAuthenticationContext";

const NAVIGATION_ITEMS = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/find-ride", label: "Find a Ride", icon: Search },
  { to: "/offer-ride", label: "Offer a Ride", icon: Car },
  { to: "/rides", label: "My Rides", icon: ListChecks },
];

export function EmployeeAppHeader({ title }: { title: string }) {
  const navigate = useNavigate();
  const { session, signOut } = useEmployeeAuthentication();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

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
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-[color:var(--color-border-primary)] bg-white/95 px-4 py-3 backdrop-blur">
      <button
        type="button"
        onClick={() => setIsDrawerOpen(true)}
        className="rounded-lg p-1 text-text-primary hover:bg-surface-secondary"
        aria-label="Open menu"
      >
        <Menu size={22} />
      </button>
      <h1 className="text-base font-bold">{title}</h1>
      <button
        type="button"
        onClick={() => setIsProfileOpen((current) => !current)}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-raahi-600 text-xs font-bold text-white"
        aria-label="Profile"
      >
        {initials}
      </button>

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
              onClick={handleSignOut}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-rose-500 hover:bg-surface-secondary"
            >
              <LogOut size={16} /> Sign out
            </button>
          </div>
        </>
      )}

      {isDrawerOpen && (
        <div className="fixed inset-0 z-40 flex">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setIsDrawerOpen(false)}
            aria-hidden
          />
          <nav className="animate-fade-in relative flex h-full w-72 max-w-[80%] flex-col bg-white p-4">
            <div className="mb-6 flex items-center justify-between">
              <span className="text-lg font-extrabold">Raahi</span>
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex flex-col gap-1">
              {NAVIGATION_ITEMS.map((item) => (
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
      )}
    </header>
  );
}
