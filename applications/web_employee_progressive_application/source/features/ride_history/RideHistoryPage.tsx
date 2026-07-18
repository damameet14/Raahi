import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Clock, IndianRupee } from "lucide-react";

import { EmployeeAppHeader } from "../../shared_user_interface_infrastructure/layout/EmployeeAppHeader";
import { listMyRideHistory } from "../../shared_user_interface_infrastructure/backend_communication/employee_ride_api";
import type { RideBooking } from "../../shared_user_interface_infrastructure/backend_communication/employee_api_types";
import { TripStatusPill } from "../../shared_user_interface_infrastructure/reusable_components/TripStatusPill";
import { formatTravelDate } from "../upcoming_rides/upcomingRideSelectors";

export function RideHistoryPage() {
  const historyQuery = useQuery({
    queryKey: ["employee-ride-history"],
    queryFn: listMyRideHistory,
  });

  const completedBookings = historyQuery.data ?? [];

  return (
    <div className="min-h-screen pb-10">
      <EmployeeAppHeader title="Ride History" leftAction="menu" />

      <div className="px-4 py-4">
        <div className="mb-4">
          <h2 className="text-lg font-bold">Completed Rides</h2>
          <p className="text-xs text-text-muted">
            A record of trips completed as passenger or driver.
          </p>
        </div>

        {historyQuery.isLoading ? (
          <EmptyState message="Loading ride history..." />
        ) : completedBookings.length > 0 ? (
          <div className="flex flex-col gap-3">
            {completedBookings.map((booking) => (
              <HistoryCard key={booking.id} booking={booking} />
            ))}
          </div>
        ) : (
          <EmptyState message="No completed rides yet" />
        )}
      </div>
    </div>
  );
}

function HistoryCard({ booking }: { booking: RideBooking }) {
  return (
    <article className="rounded-2xl border border-[color:var(--color-border-primary)] bg-white p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold">
            {formatTravelDate(booking.travel_date)} · {booking.departure_time}
          </p>
          <p className="text-xs text-text-muted">
            Driver: {booking.driver_full_name} · Passenger:{" "}
            {booking.passenger_full_name}
          </p>
        </div>
        <TripStatusPill status={booking.trip_status} />
      </div>

      <div className="flex items-center gap-2 text-sm">
        <span className="truncate">{booking.pickup_label ?? "Pickup"}</span>
        <ArrowRight size={14} className="shrink-0 text-text-muted" />
        <span className="truncate">{booking.drop_label ?? "Destination"}</span>
      </div>

      <div className="mt-3 grid grid-cols-3 items-center gap-2 text-xs text-text-secondary">
        <span className="flex items-center gap-1">
          <IndianRupee size={13} /> {booking.fare_amount.toFixed(0)}
        </span>
        <span className="flex items-center gap-1">
          <Clock size={13} /> {booking.completed_at ? "Completed" : "Recorded"}
        </span>
        <PaymentStatusPill paymentStatus={booking.payment_status} />
      </div>
      <p className="mt-2 text-xs text-text-muted">
        {booking.vehicle_make_and_model} · {booking.vehicle_number}
      </p>
    </article>
  );
}

function PaymentStatusPill({ paymentStatus }: { paymentStatus: string }) {
  const isPaid = paymentStatus === "PAID";
  return (
    <span
      className={`justify-self-end rounded-full px-2 py-0.5 text-[11px] font-semibold ${
        isPaid
          ? "bg-raahi-50 text-raahi-700"
          : "bg-surface-secondary text-text-secondary"
      }`}
    >
      {isPaid ? "Paid" : "Unpaid"}
    </span>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-[color:var(--color-border-secondary)] bg-surface-secondary p-6 text-center text-sm text-text-muted">
      {message}
    </div>
  );
}
