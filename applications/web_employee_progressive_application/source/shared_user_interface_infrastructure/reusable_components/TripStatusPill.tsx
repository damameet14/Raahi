/** Small colored pill rendering a trip or journey status label. */

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  BOOKED: { label: "Booked", className: "bg-raahi-50 text-raahi-700" },
  STARTED: { label: "Ongoing", className: "bg-amber-100 text-amber-700" },
  COMPLETED: { label: "Completed", className: "bg-surface-tertiary text-text-secondary" },
  CANCELLED: { label: "Cancelled", className: "bg-rose-100 text-rose-600" },
  OPEN: { label: "Open", className: "bg-raahi-50 text-raahi-700" },
  FULL: { label: "Full", className: "bg-amber-100 text-amber-700" },
  PENDING: { label: "Pending", className: "bg-amber-100 text-amber-700" },
  MATCHED: { label: "Matched", className: "bg-raahi-50 text-raahi-700" },
};

export function TripStatusPill({ status }: { status: string }) {
  const style = STATUS_STYLES[status] ?? {
    label: status,
    className: "bg-surface-tertiary text-text-secondary",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${style.className}`}
    >
      {style.label}
    </span>
  );
}
