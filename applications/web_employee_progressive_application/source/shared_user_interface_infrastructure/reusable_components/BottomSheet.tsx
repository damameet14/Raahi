import type { ReactNode } from "react";
import { X } from "lucide-react";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}

/**
 * A modal sheet that slides up and covers most of the screen, used for the
 * Find Ride / Offer Ride flows and ride detail popups. Scrolls its own body.
 */
export function BottomSheet({
  isOpen,
  onClose,
  title,
  children,
  footer,
}: BottomSheetProps) {
  if (!isOpen) {
    return null;
  }
  return (
    <div className="fixed inset-0 z-40 flex justify-center">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden
      />
      <div className="animate-sheet-up absolute bottom-0 flex max-h-[92%] w-full max-w-[480px] flex-col rounded-t-3xl bg-white">
        <div className="flex items-center justify-between border-b border-[color:var(--color-border-primary)] px-4 py-3">
          <h2 className="text-base font-bold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-text-secondary hover:bg-surface-secondary"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4">{children}</div>
        {footer && (
          <div className="border-t border-[color:var(--color-border-primary)] px-4 py-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
