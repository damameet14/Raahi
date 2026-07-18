/**
 * Looks up a booking by id from the employee's passenger and driver lists and
 * reports which role the current employee holds on it. Used by the ride detail
 * and ongoing screens to render role-appropriate controls without a dedicated
 * get-by-id endpoint.
 */

import { useQuery } from "@tanstack/react-query";

import {
  listMyPassengerBookings,
  listMyDriverBookings,
} from "../../shared_user_interface_infrastructure/backend_communication/employee_ride_api";
import type { RideBooking } from "../../shared_user_interface_infrastructure/backend_communication/employee_api_types";

export type BookingRole = "passenger" | "driver";

interface BookingLookupResult {
  booking: RideBooking | null;
  role: BookingRole | null;
  isLoading: boolean;
}

export function useBookingLookup(
  rideBookingId: string | undefined,
): BookingLookupResult {
  const passengerBookingsQuery = useQuery({
    queryKey: ["passenger-bookings"],
    queryFn: listMyPassengerBookings,
  });
  const driverBookingsQuery = useQuery({
    queryKey: ["driver-bookings"],
    queryFn: listMyDriverBookings,
  });

  const passengerBooking = (passengerBookingsQuery.data ?? []).find(
    (booking) => booking.id === rideBookingId,
  );
  if (passengerBooking) {
    return { booking: passengerBooking, role: "passenger", isLoading: false };
  }

  const driverBooking = (driverBookingsQuery.data ?? []).find(
    (booking) => booking.id === rideBookingId,
  );
  if (driverBooking) {
    return { booking: driverBooking, role: "driver", isLoading: false };
  }

  return {
    booking: null,
    role: null,
    isLoading:
      passengerBookingsQuery.isLoading || driverBookingsQuery.isLoading,
  };
}
