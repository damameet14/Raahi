/**
 * Persistent bottom tab bar for the app's hub screens (Home and My Rides).
 * Task-flow screens (Find/Offer Ride, ride detail, profile) don't render it —
 * they use the header's back/close action instead so the flow stays focused.
 */

import { Link, useLocation } from "react-router-dom";
import { Home, Search, Car, ListChecks } from "lucide-react";

const NAVIGATION_ITEMS = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/find-ride", label: "Find a Ride", icon: Search },
  { to: "/offer-ride", label: "Offer a Ride", icon: Car },
  { to: "/rides", label: "My Rides", icon: ListChecks },
];

export function BottomNavigationBar() {
  const location = useLocation();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 mx-auto flex max-w-[480px] items-stretch justify-between border-t border-[color:var(--color-border-primary)] bg-white/95 px-2 backdrop-blur">
      {NAVIGATION_ITEMS.map((item) => {
        const isActive = location.pathname === item.to;
        return (
          <Link
            key={item.to}
            to={item.to}
            className={`flex flex-1 flex-col items-center gap-1 py-2 text-[11px] font-medium ${
              isActive ? "text-raahi-700" : "text-text-muted"
            }`}
          >
            <item.icon size={20} className={isActive ? "text-raahi-700" : "text-text-muted"} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
