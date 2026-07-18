/**
 * My Rides overview (Menu → Rides): Upcoming Rides, Ride Requests, and Ride
 * Offers tabs. Upcoming groups the employee's booked/ongoing trips by date;
 * the other tabs list the raw requests and offers they have created.
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";

import { EmployeeAppHeader } from "../../shared_user_interface_infrastructure/layout/EmployeeAppHeader";
import { BottomNavigationBar } from "../../shared_user_interface_infrastructure/layout/BottomNavigationBar";
import {
  listMyPassengerBookings,
  listMyDriverBookings,
  listMyRideRequests,
  listMyRideOffers,
} from "../../shared_user_interface_infrastructure/backend_communication/employee_ride_api";
import { TripStatusPill } from "../../shared_user_interface_infrastructure/reusable_components/TripStatusPill";
import { UpcomingRideCard } from "../upcoming_rides/UpcomingRideCard";
import {
  groupBookingsByDate,
  selectUpcomingBookings,
  formatTravelDate,
} from "../upcoming_rides/upcomingRideSelectors";

type RidesTab = "upcoming" | "requests" | "offers";

const TABS: Array<{ id: RidesTab; label: string }> = [
  { id: "upcoming", label: "Upcoming" },
  { id: "requests", label: "Ride Requests" },
  { id: "offers", label: "Ride Offers" },
];

export function RidesOverviewPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<RidesTab>("upcoming");

  const passengerBookingsQuery = useQuery({
    queryKey: ["passenger-bookings"],
    queryFn: listMyPassengerBookings,
  });
  const driverBookingsQuery = useQuery({
    queryKey: ["driver-bookings"],
    queryFn: listMyDriverBookings,
  });
  const requestsQuery = useQuery({
    queryKey: ["my-ride-requests"],
    queryFn: listMyRideRequests,
    enabled: activeTab === "requests",
  });
  const offersQuery = useQuery({
    queryKey: ["my-ride-offers"],
    queryFn: listMyRideOffers,
    enabled: activeTab === "offers",
  });

  const upcomingBookings = selectUpcomingBookings([
    ...(passengerBookingsQuery.data ?? []),
    ...(driverBookingsQuery.data ?? []),
  ]);
  const groupedUpcoming = groupBookingsByDate(upcomingBookings);

  return (
    <div className="min-h-screen pb-24">
      <EmployeeAppHeader title="My Rides" />

      <div className="flex gap-1 border-b border-[color:var(--color-border-primary)] px-4">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`border-b-2 px-3 py-3 text-sm font-semibold transition ${
              activeTab === tab.id
                ? "border-raahi-600 text-raahi-700"
                : "border-transparent text-text-secondary"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="px-4 py-4">
        {activeTab === "upcoming" &&
          (upcomingBookings.length === 0 ? (
            <EmptyState message="No upcoming rides" />
          ) : (
            <div className="flex flex-col gap-4">
              {groupedUpcoming.map((group) => (
                <div key={group.travelDate}>
                  <p className="mb-2 text-xs font-semibold text-text-muted">
                    {group.formattedDate}
                  </p>
                  <div className="flex flex-col gap-3">
                    {group.bookings.map((booking) => (
                      <UpcomingRideCard
                        key={booking.id}
                        booking={booking}
                        onClick={() =>
                          navigate(
                            booking.trip_status === "STARTED"
                              ? `/ongoing/${booking.id}`
                              : `/rides/upcoming/${booking.id}`,
                          )
                        }
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}

        {activeTab === "requests" &&
          (requestsQuery.data && requestsQuery.data.length > 0 ? (
            <div className="flex flex-col gap-3">
              {requestsQuery.data.map((request) => (
                <div
                  key={request.id}
                  className="rounded-2xl border border-[color:var(--color-border-primary)] bg-white p-4"
                >
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-sm font-semibold">
                      {formatTravelDate(request.travel_date)} ·{" "}
                      {request.departure_time}
                    </span>
                    <TripStatusPill status={request.status} />
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="truncate">
                      {request.source_label ?? "Pickup"}
                    </span>
                    <ArrowRight size={14} className="shrink-0 text-text-muted" />
                    <span className="truncate">
                      {request.destination_label ?? "Destination"}
                    </span>
                  </div>
                  {request.estimated_fare_amount != null && (
                    <p className="mt-2 text-xs text-text-secondary">
                      Est. ₹{request.estimated_fare_amount.toFixed(0)} ·{" "}
                      {request.seats_requested} seat
                      {request.seats_requested > 1 ? "s" : ""}
                      {request.is_recurring ? " · R" : ""}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState message="No ride requests yet" />
          ))}

        {activeTab === "offers" &&
          (offersQuery.data && offersQuery.data.length > 0 ? (
            <div className="flex flex-col gap-3">
              {offersQuery.data.map((offer) => (
                <div
                  key={offer.id}
                  className="rounded-2xl border border-[color:var(--color-border-primary)] bg-white p-4"
                >
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-sm font-semibold">
                      {formatTravelDate(offer.travel_date)} ·{" "}
                      {offer.departure_window_start_time}–
                      {offer.departure_window_end_time}
                    </span>
                    <TripStatusPill status={offer.journey_status} />
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="truncate">
                      {offer.source_label ?? "Pickup"}
                    </span>
                    <ArrowRight size={14} className="shrink-0 text-text-muted" />
                    <span className="truncate">
                      {offer.destination_label ?? "Destination"}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-text-secondary">
                    {offer.seats_available}/{offer.seats_total} seats free
                    {offer.is_recurring ? " · R" : ""}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState message="No ride offers yet" />
          ))}
      </div>

      <BottomNavigationBar />
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
