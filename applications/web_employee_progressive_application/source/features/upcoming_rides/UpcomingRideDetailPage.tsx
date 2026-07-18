/**
 * Confirmed ride details (screen 1C). Reached after booking or from Upcoming
 * Rides. Shows driver, route, schedule, fare, and — for the passenger — the
 * pickup OTP. The driver can start the journey from here (screen 1D/2C).
 */

import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, KeyRound } from "lucide-react";
import toast from "react-hot-toast";

import { EmployeeAppHeader } from "../../shared_user_interface_infrastructure/layout/EmployeeAppHeader";
import { RoutePreviewMap } from "../../shared_user_interface_infrastructure/maps/RoutePreviewMap";
import { PrimaryButton } from "../../shared_user_interface_infrastructure/reusable_components/PrimaryButton";
import { TripStatusPill } from "../../shared_user_interface_infrastructure/reusable_components/TripStatusPill";
import {
  startJourney,
  cancelBooking,
  cancelRideOffer,
} from "../../shared_user_interface_infrastructure/backend_communication/employee_ride_api";
import { extractApiErrorMessage } from "../../shared_user_interface_infrastructure/backend_communication/extractApiErrorMessage";
import { useBookingLookup } from "./useBookingLookup";

export function UpcomingRideDetailPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { rideBookingId } = useParams();
  const { booking, role, isLoading } = useBookingLookup(rideBookingId);
  const [isConfirmingCancel, setIsConfirmingCancel] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="animate-spin text-raahi-600" />
      </div>
    );
  }
  if (!booking) {
    return (
      <div className="min-h-screen">
        <EmployeeAppHeader title="Ride details" />
        <div className="p-6 text-center text-sm text-text-muted">
          This ride could not be found.
        </div>
      </div>
    );
  }

  async function handleStartRide() {
    if (!booking) {
      return;
    }
    try {
      await startJourney(booking.ride_offer_id);
    } catch {
      // The journey may already be started; proceed to tracking regardless.
    }
    navigate(`/ongoing/${booking.id}`);
  }

  async function handleCancelRide() {
    if (!booking) {
      return;
    }
    setIsCancelling(true);
    try {
      await cancelBooking(booking.id);
      await queryClient.invalidateQueries({ queryKey: ["passenger-bookings"] });
      toast.success("Ride cancelled");
      navigate("/rides", { replace: true });
    } catch (error) {
      toast.error(extractApiErrorMessage(error, "Could not cancel this ride"));
    } finally {
      setIsCancelling(false);
    }
  }

  async function handleCancelOffer() {
    if (!booking) {
      return;
    }
    setIsCancelling(true);
    try {
      await cancelRideOffer(booking.ride_offer_id);
      await queryClient.invalidateQueries({ queryKey: ["driver-bookings"] });
      await queryClient.invalidateQueries({ queryKey: ["passenger-bookings"] });
      toast.success("Ride cancelled");
      navigate("/rides", { replace: true });
    } catch (error) {
      toast.error(extractApiErrorMessage(error, "Could not cancel this ride"));
    } finally {
      setIsCancelling(false);
    }
  }

  const DRIVER_CANCELLATION_CUTOFF_HOURS = 2;
  const isJourneyNotStarted =
    booking.ride_offer_journey_status === "OPEN" ||
    booking.ride_offer_journey_status === "FULL";
  // Passenger may cancel any time until the driver starts the journey.
  const canPassengerCancel =
    role === "passenger" &&
    booking.trip_status === "BOOKED" &&
    isJourneyNotStarted;
  // Driver may cancel only while more than 2 hours remain before the offer's
  // departure. When the departure time is unknown (older backend without the
  // field) we let the button through and rely on the server to enforce it.
  const hoursUntilDeparture = booking.ride_offer_departure_window_start_time
    ? (new Date(
        `${booking.travel_date}T${booking.ride_offer_departure_window_start_time}`,
      ).getTime() -
        Date.now()) /
      3_600_000
    : Number.POSITIVE_INFINITY;
  const canDriverCancel =
    role === "driver" &&
    isJourneyNotStarted &&
    hoursUntilDeparture >= DRIVER_CANCELLATION_CUTOFF_HOURS;

  return (
    <div className="min-h-screen pb-10">
      <EmployeeAppHeader title="Ride details" />

      <div className="flex flex-col gap-4 px-4 py-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">
            {booking.travel_date} · {booking.departure_time}
          </span>
          <TripStatusPill status={booking.trip_status} />
        </div>

        <RoutePreviewMap
          origin={{
            lat: booking.pickup_latitude,
            lng: booking.pickup_longitude,
          }}
          destination={{
            lat: booking.drop_latitude,
            lng: booking.drop_longitude,
          }}
        />

        {role === "passenger" && booking.otp_code && (
          <div className="rounded-2xl border border-raahi-200 bg-raahi-50 p-4 text-center">
            <p className="flex items-center justify-center gap-1 text-xs font-semibold uppercase tracking-wide text-raahi-700">
              <KeyRound size={12} /> Share this OTP at pickup
            </p>
            <p className="mt-1 text-4xl font-black tracking-[0.4em] text-raahi-800">
              {booking.otp_code}
            </p>
          </div>
        )}

        <div className="rounded-2xl border border-[color:var(--color-border-primary)] p-4">
          <DetailRow
            label={role === "driver" ? "Passenger" : "Driver"}
            value={
              role === "driver"
                ? booking.passenger_full_name
                : booking.driver_full_name
            }
          />
          <DetailRow
            label="Vehicle"
            value={`${booking.vehicle_make_and_model} · ${booking.vehicle_number}`}
          />
          <DetailRow label="Seats" value={String(booking.seats_booked)} />
          <DetailRow label="Fare" value={`₹${booking.fare_amount.toFixed(2)}`} />
          {role === "passenger" && booking.driver_phone && (
            <DetailRow label="Driver phone" value={booking.driver_phone} />
          )}
        </div>

        {role === "driver" ? (
          <PrimaryButton onClick={handleStartRide}>Start ride</PrimaryButton>
        ) : booking.trip_status === "STARTED" ? (
          <PrimaryButton onClick={() => navigate(`/ongoing/${booking.id}`)}>
            Track ride
          </PrimaryButton>
        ) : (
          <PrimaryButton
            variant="secondary"
            onClick={() => navigate("/home")}
          >
            Go to home
          </PrimaryButton>
        )}
        {role === "driver" && (
          <button
            type="button"
            onClick={() => {
              toast("Waiting at pickup? Start the ride to enter the OTP.");
            }}
            className="text-center text-xs text-text-muted"
          >
            You will enter the passenger's OTP after starting the ride.
          </button>
        )}

        {(canPassengerCancel || canDriverCancel) && (
          <div className="rounded-2xl border border-rose-200 p-4">
            {isConfirmingCancel ? (
              <>
                <p className="mb-3 text-center text-sm font-medium text-rose-600">
                  {role === "driver"
                    ? "Cancel this ride for all passengers? This can't be undone."
                    : "Cancel this ride? This can't be undone."}
                </p>
                <div className="flex gap-3">
                  <PrimaryButton
                    variant="secondary"
                    onClick={() => setIsConfirmingCancel(false)}
                    disabled={isCancelling}
                  >
                    Keep ride
                  </PrimaryButton>
                  <PrimaryButton
                    onClick={
                      role === "driver" ? handleCancelOffer : handleCancelRide
                    }
                    isLoading={isCancelling}
                  >
                    Yes, cancel
                  </PrimaryButton>
                </div>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setIsConfirmingCancel(true)}
                className="w-full text-center text-sm font-semibold text-rose-600"
              >
                Cancel ride
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-[color:var(--color-border-primary)] py-2 text-sm last:border-b-0">
      <span className="text-text-muted">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
