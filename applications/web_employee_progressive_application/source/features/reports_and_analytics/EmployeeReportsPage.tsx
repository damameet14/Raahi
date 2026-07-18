import { useQuery } from "@tanstack/react-query";
import { BarChart3, Car, IndianRupee, Route, UsersRound } from "lucide-react";

import { EmployeeAppHeader } from "../../shared_user_interface_infrastructure/layout/EmployeeAppHeader";
import {
  getMyRideReportSummary,
  listMyRideHistory,
} from "../../shared_user_interface_infrastructure/backend_communication/employee_ride_api";

export function EmployeeReportsPage() {
  const reportSummaryQuery = useQuery({
    queryKey: ["employee-ride-report-summary"],
    queryFn: getMyRideReportSummary,
  });
  const rideHistoryQuery = useQuery({
    queryKey: ["employee-ride-history"],
    queryFn: listMyRideHistory,
  });

  const summary = reportSummaryQuery.data;
  const recentHistory = (rideHistoryQuery.data ?? []).slice(0, 4);

  const metricCards = [
    {
      label: "Completed Trips",
      value: String(summary?.completed_trips ?? 0),
      icon: BarChart3,
    },
    {
      label: "Distance",
      value: `${(summary?.total_distance_kilometers ?? 0).toFixed(1)} km`,
      icon: Route,
    },
    {
      label: "Passenger Spend",
      value: `₹${(summary?.passenger_spend_amount ?? 0).toFixed(0)}`,
      icon: IndianRupee,
    },
    {
      label: "Driver Earnings",
      value: `₹${(summary?.driver_earning_amount ?? 0).toFixed(0)}`,
      icon: Car,
    },
    {
      label: "Seats Shared",
      value: String(summary?.seats_shared_as_driver ?? 0),
      icon: UsersRound,
    },
    {
      label: "Avg Fare",
      value: `₹${(summary?.average_fare_per_trip ?? 0).toFixed(0)}`,
      icon: IndianRupee,
    },
  ];

  return (
    <div className="min-h-screen pb-10">
      <EmployeeAppHeader title="Reports" leftAction="menu" />

      <div className="px-4 py-4">
        <div className="mb-4">
          <h2 className="text-lg font-bold">My Commute Reports</h2>
          <p className="text-xs text-text-muted">
            Personal analytics from your completed ride bookings.
          </p>
        </div>

        {reportSummaryQuery.isLoading ? (
          <EmptyState message="Loading reports..." />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              {metricCards.map((card) => (
                <article
                  key={card.label}
                  className="rounded-2xl border border-[color:var(--color-border-primary)] bg-white p-4"
                >
                  <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-raahi-50 text-raahi-700">
                    <card.icon size={18} />
                  </div>
                  <p className="text-xl font-extrabold">{card.value}</p>
                  <p className="mt-1 text-xs text-text-muted">{card.label}</p>
                </article>
              ))}
            </div>

            <section className="mt-6 rounded-2xl border border-[color:var(--color-border-primary)] bg-white p-4">
              <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-text-secondary">
                Recent Completed Trips
              </h3>
              {recentHistory.length > 0 ? (
                <div className="grid gap-3">
                  {recentHistory.map((booking) => (
                    <div
                      key={booking.id}
                      className="flex items-center justify-between gap-3 border-b border-[color:var(--color-border-primary)] pb-3 last:border-b-0 last:pb-0"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">
                          {booking.pickup_label ?? "Pickup"} to{" "}
                          {booking.drop_label ?? "Destination"}
                        </p>
                        <p className="text-xs text-text-muted">
                          {booking.travel_date} · {booking.seats_booked} seat
                          {booking.seats_booked > 1 ? "s" : ""}
                        </p>
                      </div>
                      <span className="text-sm font-bold text-raahi-700">
                        ₹{booking.fare_amount.toFixed(0)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-text-muted">
                  Complete a ride to populate report details.
                </p>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-[color:var(--color-border-secondary)] bg-surface-secondary p-6 text-center text-sm text-text-muted">
      {message}
    </div>
  );
}
