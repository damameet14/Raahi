/**
 * Side navigation menu for the administration portal.
 */

import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Car,
  BarChart3,
  Settings,
  UserCircle,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import { useAuthenticatedUser } from '../authentication_state/AuthenticationContextProvider';
import { RaahiBrandLockup } from '../branding/RaahiBrandLockup';

const companyAdminMenuItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/employees', label: 'Employees', icon: Users },
  { path: '/vehicles', label: 'Vehicles', icon: Car },
  { path: '/reports', label: 'Reports', icon: BarChart3 },
  { path: '/settings', label: 'Settings', icon: Settings },
  { path: '/profile', label: 'Profile', icon: UserCircle },
];

const superAdminMenuItems = [
  { path: '/platform/onboarding', label: 'Onboarding', icon: ShieldCheck },
  { path: '/profile', label: 'Profile', icon: UserCircle },
];

export function SideNavigationMenu() {
  const { clearAuthenticationState, authenticatedUser } = useAuthenticatedUser();
  const isSuperAdmin = authenticatedUser?.role === 'SUPER_ADMIN';
  const navigationMenuItems = isSuperAdmin
    ? superAdminMenuItems
    : companyAdminMenuItems;

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-border-primary bg-surface-secondary">
      <div className="flex h-20 items-center border-b border-border-primary px-6">
        <div className="flex flex-col items-start gap-1">
          <RaahiBrandLockup compact />
          <p className="text-[10px] font-medium text-text-muted uppercase tracking-widest">
            {isSuperAdmin ? 'Platform Admin' : 'Admin Portal'}
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5">
        {navigationMenuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all duration-200 ${
                isActive
                  ? 'border border-raahi-500 bg-white text-raahi-700 shadow-sm'
                  : 'text-text-secondary hover:bg-white hover:text-text-primary'
              }`
            }
          >
            <item.icon className="h-[18px] w-[18px]" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-border-primary p-4">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-raahi-500 text-xs font-bold text-white">
            {authenticatedUser?.fullName?.charAt(0) || 'A'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-text-primary">
              {authenticatedUser?.fullName || 'Administrator'}
            </p>
            <p className="truncate text-xs text-text-muted">
              {authenticatedUser?.email || ''}
            </p>
          </div>
        </div>
        <button
          onClick={clearAuthenticationState}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-rose-500 transition-colors hover:bg-rose-50"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
