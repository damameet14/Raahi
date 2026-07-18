/**
 * Side navigation menu for the administration portal.
 *
 * Displays navigation links organized by admin capability.
 * Highlights the currently active route.
 */

import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Car,
  BarChart3,
  Settings,
  UserCircle,
  Building2,
  LogOut,
} from 'lucide-react';
import { useAuthenticatedUser } from '../authentication_state/AuthenticationContextProvider';

const navigationMenuItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/employees', label: 'Employees', icon: Users },
  { path: '/vehicles', label: 'Vehicles', icon: Car },
  { path: '/reports', label: 'Reports', icon: BarChart3 },
  { path: '/settings', label: 'Settings', icon: Settings },
  { path: '/profile', label: 'Profile', icon: UserCircle },
];

export function SideNavigationMenu() {
  const { clearAuthenticationState, authenticatedUser } = useAuthenticatedUser();

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-border-primary bg-surface-secondary">
      {/* ── Brand ──────────────────────────────────────── */}
      <div className="flex h-16 items-center gap-3 border-b border-border-primary px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-raahi">
          <Building2 className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-base font-bold text-text-primary tracking-tight">Raahi</h1>
          <p className="text-[10px] font-medium text-text-muted uppercase tracking-widest">Admin Portal</p>
        </div>
      </div>

      {/* ── Navigation links ───────────────────────────── */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navigationMenuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-raahi-600/20 text-raahi-400 shadow-sm'
                  : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
              }`
            }
          >
            <item.icon className="h-[18px] w-[18px]" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* ── User info & logout ─────────────────────────── */}
      <div className="border-t border-border-primary p-4">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-raahi-600 text-xs font-bold text-white">
            {authenticatedUser?.fullName?.charAt(0) || 'A'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-text-primary">
              {authenticatedUser?.fullName || 'Administrator'}
            </p>
            <p className="truncate text-xs text-text-muted">
              {authenticatedUser?.email || ''}
            </p>
          </div>
        </div>
        <button
          onClick={clearAuthenticationState}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-rose-400 transition-colors hover:bg-rose-500/10"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
