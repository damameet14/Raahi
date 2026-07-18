/**
 * Home screen: profile + navigation (via the shared header), the Upcoming
 * Rides summary grouped by date, and the Find Ride / Offer Ride actions.
 */

import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search, Car, ChevronRight } from "lucide-react";

import { EmployeeAppHeader } from "../../shared_user_interface_infrastructure/layout/EmployeeAppHeader";
import { useEmployeeProfileQuery } from "../../shared_user_interface_infrastructure/employee_profile/useEmployeeProfileQuery";
import {
  listMyPassengerBookings,
  listMyDriverBookings,
} from "../../shared_user_interface_infrastructure/backend_communication/employee_ride_api";
import type { RideBooking } from "../../shared_user_interface_infrastructure/backend_communication/employee_api_types";
import { UpcomingRideCard } from "../upcoming_rides/UpcomingRideCard";
import {
  groupBookingsByDate,
  selectUpcomingBookings,
} from "../upcoming_rides/upcomingRideSelectors";

export function HomePage() {
  const navigate = useNavigate();
  const profileQuery = useEmployeeProfileQuery();

  const passengerBookingsQuery = useQuery({
    queryKey: ["passenger-bookings"],
    queryFn: listMyPassengerBookings,
    refetchInterval: 15_000,
  });
  const driverBookingsQuery = useQuery({
    queryKey: ["driver-bookings"],
    queryFn: listMyDriverBookings,
    refetchInterval: 15_000,
  });

  const upcomingBookings = selectUpcomingBookings([
    ...(passengerBookingsQuery.data ?? []),
    ...(driverBookingsQuery.data ?? []),
  ]);
  const groupedByDate = groupBookingsByDate(upcomingBookings);
  const canOfferRide = profileQuery.data?.can_offer_ride ?? false;

  function openBooking(booking: RideBooking) {
    if (booking.trip_status === "STARTED") {
      navigate(`/ongoing/${booking.id}`);
    } else {
      navigate(`/rides/upcoming/${booking.id}`);
    }
  }

  return (
    <div className="min-h-screen pb-10">
      <EmployeeAppHeader title="Raahi" />

      <div className="px-4 py-4">
        <section className="mb-6">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wide text-text-secondary">
              Upcoming Rides
            </h2>
            {upcomingBookings.length > 0 && (
              <button
                type="button"
                onClick={() => navigate("/rides")}
                className="flex items-center text-xs font-semibold text-raahi-700"
              >
                View more <ChevronRight size={14} />
              </button>
            )}
          </div>

          {upcomingBookings.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[color:var(--color-border-secondary)] bg-surface-secondary p-6 text-center text-sm text-text-muted">
              No upcoming rides
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {groupedByDate.map((group) => (
                <div key={group.travelDate}>
                  <p className="mb-2 text-xs font-semibold text-text-muted">
                    {group.formattedDate}
                  </p>
                  <div className="flex flex-col gap-3">
                    {group.bookings.map((booking) => (
                      <UpcomingRideCard
                        key={booking.id}
                        booking={booking}
                        onClick={() => openBooking(booking)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => navigate("/find-ride")}
            className="flex items-center gap-4 rounded-2xl bg-raahi-600 p-5 text-left text-white"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15">
              <Search size={24} />
            </div>
            <div>
              <p className="text-lg font-bold">Find a Ride</p>
              <p className="text-sm text-white/80">
                Search rides matching your commute
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => navigate("/offer-ride")}
            disabled={!canOfferRide}
            className="flex items-center gap-4 rounded-2xl border border-[color:var(--color-border-primary)] bg-white p-5 text-left disabled:opacity-60"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-raahi-50 text-raahi-700">
              <Car size={24} />
            </div>
            <div>
              <p className="text-lg font-bold">Offer a Ride</p>
              <p className="text-sm text-text-secondary">
                {canOfferRide
                  ? "Publish a ride in your vehicle"
                  : "Add a vehicle to offer rides"}
              </p>
            </div>
          </button>
        </section>
      </div>
    </div>
  );
}
