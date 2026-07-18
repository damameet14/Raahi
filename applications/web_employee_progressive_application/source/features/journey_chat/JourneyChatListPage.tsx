/**
 * Chat hub (drawer "Chat" entry): lists journeys the employee can chat in,
 * derived from their active passenger and driver bookings, each linking into
 * that journey's group chat.
 */

import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { ChevronRight, MessageCircle } from "lucide-react";

import { EmployeeAppHeader } from "../../shared_user_interface_infrastructure/layout/EmployeeAppHeader";
import {
  listMyDriverBookings,
  listMyPassengerBookings,
} from "../../shared_user_interface_infrastructure/backend_communication/employee_ride_api";
import type { RideBooking } from "../../shared_user_interface_infrastructure/backend_communication/employee_api_types";
import { formatTravelDate } from "../upcoming_rides/upcomingRideSelectors";

interface JourneyChatEntry {
  rideOfferId: string;
  title: string;
  subtitle: string;
  callPhone: string | null;
  callName: string | null;
}

const ACTIVE_TRIP_STATUSES = new Set(["BOOKED", "STARTED"]);

export function JourneyChatListPage() {
  const navigate = useNavigate();
  const passengerBookingsQuery = useQuery({
    queryKey: ["passenger-bookings"],
    queryFn: listMyPassengerBookings,
  });
  const driverBookingsQuery = useQuery({
    queryKey: ["driver-bookings"],
    queryFn: listMyDriverBookings,
  });

  const isLoading =
    passengerBookingsQuery.isLoading || driverBookingsQuery.isLoading;
  const entries = buildChatEntries(
    passengerBookingsQuery.data ?? [],
    driverBookingsQuery.data ?? [],
  );

  return (
    <div className="min-h-screen pb-10">
      <EmployeeAppHeader title="Chat" leftAction="menu" />
      <div className="px-4 py-4">
        <p className="mb-4 text-xs text-text-muted">
          Coordinate with your driver and co-passengers for active journeys.
        </p>
        {isLoading ? (
          <EmptyState message="Loading conversations..." />
        ) : entries.length > 0 ? (
          <div className="flex flex-col gap-3">
            {entries.map((entry) => (
              <button
                key={entry.rideOfferId}
                type="button"
                onClick={() =>
                  navigate(`/journeys/${entry.rideOfferId}/chat`, {
                    state: {
                      callPhone: entry.callPhone,
                      callName: entry.callName,
                    },
                  })
                }
                className="flex items-center gap-3 rounded-2xl border border-[color:var(--color-border-primary)] bg-white p-4 text-left transition hover:bg-surface-secondary"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface-secondary text-raahi-700">
                  <MessageCircle size={20} />
                </span>
                <span className="flex-1">
                  <span className="block text-sm font-bold">{entry.title}</span>
                  <span className="block text-xs text-text-muted">
                    {entry.subtitle}
                  </span>
                </span>
                <ChevronRight size={18} className="text-text-muted" />
              </button>
            ))}
          </div>
        ) : (
          <EmptyState message="No active journeys to chat about yet" />
        )}
      </div>
    </div>
  );
}

function buildChatEntries(
  passengerBookings: RideBooking[],
  driverBookings: RideBooking[],
): JourneyChatEntry[] {
  const entriesByOfferId = new Map<string, JourneyChatEntry>();

  for (const booking of passengerBookings) {
    if (!ACTIVE_TRIP_STATUSES.has(booking.trip_status)) {
      continue;
    }
    entriesByOfferId.set(booking.ride_offer_id, {
      rideOfferId: booking.ride_offer_id,
      title: `Ride with ${booking.driver_full_name}`,
      subtitle: `${formatTravelDate(booking.travel_date)} · ${booking.departure_time}`,
      callPhone: booking.driver_phone,
      callName: booking.driver_full_name,
    });
  }

  for (const booking of driverBookings) {
    if (!ACTIVE_TRIP_STATUSES.has(booking.trip_status)) {
      continue;
    }
    if (entriesByOfferId.has(booking.ride_offer_id)) {
      continue;
    }
    entriesByOfferId.set(booking.ride_offer_id, {
      rideOfferId: booking.ride_offer_id,
      title: `Journey you're driving`,
      subtitle: `${formatTravelDate(booking.travel_date)} · ${booking.departure_time}`,
      callPhone: null,
      callName: null,
    });
  }

  return [...entriesByOfferId.values()];
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-[color:var(--color-border-secondary)] bg-surface-secondary p-6 text-center text-sm text-text-muted">
      {message}
    </div>
  );
}
