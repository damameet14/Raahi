/**
 * Shared primary navigation for the employee app.
 *
 * Used by both the mobile hamburger drawer (EmployeeAppHeader) and the
 * persistent desktop sidebar (EmployeeAppShell) so the two never drift apart.
 */

import {
  Home,
  Search,
  Car,
  ListChecks,
  WalletCards,
  History,
  MapPinned,
  BarChart3,
  MessageCircle,
  type LucideIcon,
} from "lucide-react";

export interface EmployeeNavigationItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

export const EMPLOYEE_NAVIGATION_ITEMS: EmployeeNavigationItem[] = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/find-ride", label: "Find a Ride", icon: Search },
  { to: "/offer-ride", label: "Offer a Ride", icon: Car },
  { to: "/rides", label: "My Rides", icon: ListChecks },
  { to: "/vehicles", label: "My Vehicle", icon: Car },
  { to: "/payment-methods", label: "Payment Methods", icon: WalletCards },
  { to: "/ride-history", label: "Ride History", icon: History },
  { to: "/saved-places", label: "Saved Places", icon: MapPinned },
  { to: "/reports", label: "Reports", icon: BarChart3 },
  { to: "/chat", label: "Chat", icon: MessageCircle },
];
