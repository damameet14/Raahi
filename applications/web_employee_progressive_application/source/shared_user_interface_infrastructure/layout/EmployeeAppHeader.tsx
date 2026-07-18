/**
 * Top bar shared across the employee app: a left navigation action, the
 * screen title, and the profile avatar (which opens a popover with My
 * Profile and Sign out). The Home screen has no left action since it is the
 * app's root; every other screen shows a back arrow, or — for task flows
 * like Find/Offer Ride that should be abandoned rather than stepped back
 * through — a close (X) button. Jumping between Home, Find a Ride, Offer a
 * Ride, and My Rides is handled by BottomNavigationBar, not this header.
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, X, LogOut, UserRound } from "lucide-react";

import { useEmployeeAuthentication } from "../authentication_state/EmployeeAuthenticationContext";

export type EmployeeAppHeaderLeftAction = "none" | "back" | "close";

interface EmployeeAppHeaderProps {
  title: string;
  leftAction?: EmployeeAppHeaderLeftAction;
  onLeftAction?: () => void;
}

export function EmployeeAppHeader({
  title,
  leftAction = "back",
  onLeftAction,
}: EmployeeAppHeaderProps) {
  const navigate = useNavigate();
  const { session, signOut } = useEmployeeAuthentication();
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

  function handleLeftActionClick() {
    if (onLeftAction) {
      onLeftAction();
      return;
    }
    if (leftAction === "close") {
      navigate("/home");
      return;
    }
    navigate(-1);
  }

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-[color:var(--color-border-primary)] bg-white/95 px-4 py-3 backdrop-blur">
      {leftAction === "none" ? (
        <span className="w-8" aria-hidden />
      ) : (
        <button
          type="button"
          onClick={handleLeftActionClick}
          className="rounded-lg p-1 text-text-primary hover:bg-surface-secondary"
          aria-label={leftAction === "close" ? "Close" : "Go back"}
        >
          {leftAction === "close" ? (
            <X size={22} />
          ) : (
            <ArrowLeft size={22} />
          )}
        </button>
      )}
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
  );
}
