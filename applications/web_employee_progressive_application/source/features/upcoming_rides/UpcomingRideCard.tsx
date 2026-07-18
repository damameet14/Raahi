/** Compact card for an upcoming booking, with route, time, OTP, and status. */

import { ArrowRight, KeyRound } from "lucide-react";

import type { RideBooking } from "../../shared_user_interface_infrastructure/backend_communication/employee_api_types";
import { TripStatusPill } from "../../shared_user_interface_infrastructure/reusable_components/TripStatusPill";

export function UpcomingRideCard({
  booking,
  onClick,
}: {
  booking: RideBooking;
  onClick: () => void;
}) {
  const pickupLabel = booking.pickup_label ?? "Pickup";
  const dropLabel = booking.drop_label ?? "Destination";

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-2xl border border-[color:var(--color-border-primary)] bg-white p-4 text-left"
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-semibold">{booking.departure_time}</span>
        <TripStatusPill status={booking.trip_status} />
      </div>
      <div className="flex items-center gap-2 text-sm">
        <span className="truncate">{pickupLabel}</span>
        <ArrowRight size={14} className="shrink-0 text-text-muted" />
        <span className="truncate">{dropLabel}</span>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-text-secondary">
          {booking.driver_full_name} · {booking.vehicle_make_and_model}
        </span>
        {booking.otp_code && booking.trip_status === "BOOKED" && (
          <span className="inline-flex items-center gap-1 rounded-lg bg-surface-secondary px-2 py-1 text-xs font-bold tracking-widest">
            <KeyRound size={12} className="text-raahi-600" />
            {booking.otp_code}
          </span>
        )}
      </div>
    </button>
  );
}
