/**
 * Administration portal layout with sidebar and content area.
 */

import { Outlet } from 'react-router-dom';
import { SideNavigationMenu } from './SideNavigationMenu';

export function AdministrationPortalLayout() {
  return (
    <div className="flex min-h-screen bg-surface-primary">
      <SideNavigationMenu />
      <main className="ml-64 flex-1 overflow-auto">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
