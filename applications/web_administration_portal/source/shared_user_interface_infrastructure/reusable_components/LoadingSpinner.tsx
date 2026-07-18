/**
 * Loading spinner component.
 */

import { Loader2 } from 'lucide-react';

export function LoadingSpinner({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex h-64 flex-col items-center justify-center gap-3">
      <Loader2 className="h-10 w-10 animate-spin text-raahi-500" />
      <p className="text-sm text-text-secondary">{message}</p>
    </div>
  );
}
