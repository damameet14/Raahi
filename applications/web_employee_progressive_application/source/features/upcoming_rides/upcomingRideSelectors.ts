/** Selection and grouping helpers for upcoming ride bookings. */

import type { RideBooking } from "../../shared_user_interface_infrastructure/backend_communication/employee_api_types";

const UPCOMING_TRIP_STATUSES = new Set(["BOOKED", "STARTED"]);

export interface DateGroupedBookings {
  travelDate: string;
  formattedDate: string;
  bookings: RideBooking[];
}

function bookingSortKey(booking: RideBooking): string {
  return `${booking.travel_date}T${booking.departure_time}`;
}

/** Bookings still ahead (booked or in progress), soonest first, de-duplicated. */
export function selectUpcomingBookings(bookings: RideBooking[]): RideBooking[] {
  const uniqueById = new Map<string, RideBooking>();
  for (const booking of bookings) {
    if (UPCOMING_TRIP_STATUSES.has(booking.trip_status)) {
      uniqueById.set(booking.id, booking);
    }
  }
  return [...uniqueById.values()].sort((first, second) =>
    bookingSortKey(first).localeCompare(bookingSortKey(second)),
  );
}

export function formatTravelDate(isoDate: string): string {
  const parsed = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return isoDate;
  }
  return parsed.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

/** Group bookings by travel date, each group sorted, groups in date order. */
export function groupBookingsByDate(
  bookings: RideBooking[],
): DateGroupedBookings[] {
  const groupsByDate = new Map<string, RideBooking[]>();
  for (const booking of bookings) {
    const existing = groupsByDate.get(booking.travel_date) ?? [];
    existing.push(booking);
    groupsByDate.set(booking.travel_date, existing);
  }
  return [...groupsByDate.entries()]
    .sort(([firstDate], [secondDate]) => firstDate.localeCompare(secondDate))
    .map(([travelDate, groupedBookings]) => ({
      travelDate,
      formattedDate: formatTravelDate(travelDate),
      bookings: groupedBookings,
    }));
}
