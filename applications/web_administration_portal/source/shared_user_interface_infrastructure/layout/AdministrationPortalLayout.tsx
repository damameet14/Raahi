/**
 * Administration portal layout with sidebar and content area.
 */

import { Outlet } from 'react-router-dom';
import { SideNavigationMenu } from './SideNavigationMenu';

export function AdministrationPortalLayout() {
  return (
    <div className="flex min-h-screen bg-surface-primary">
      <SideNavigationMenu />
      <main className="ml-64 flex-1 overflow-auto border-l border-border-primary bg-surface-primary">
        <div className="min-h-screen p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
