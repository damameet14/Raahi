/**
 * Ongoing ride with live tracking (screens 1D / 2C).
 *
 * Both participants see the driver's live location, refreshed every 5 seconds.
 * The driver's device posts its location on the same cadence, verifies the
 * passenger's OTP at pickup, and completes the trip on arrival. The passenger
 * sees status and their pickup OTP until it is verified.
 */

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, KeyRound } from "lucide-react";
import toast from "react-hot-toast";

import { EmployeeAppHeader } from "../../shared_user_interface_infrastructure/layout/EmployeeAppHeader";
import { LiveTrackingMap } from "../../shared_user_interface_infrastructure/maps/LiveTrackingMap";
import { PrimaryButton } from "../../shared_user_interface_infrastructure/reusable_components/PrimaryButton";
import { TripStatusPill } from "../../shared_user_interface_infrastructure/reusable_components/TripStatusPill";
import {
  getBookingTracking,
  postDriverLocation,
  verifyBookingOtp,
  completeBooking,
  completeJourney,
} from "../../shared_user_interface_infrastructure/backend_communication/employee_ride_api";
import { extractApiErrorMessage } from "../../shared_user_interface_infrastructure/backend_communication/extractApiErrorMessage";
import { useBookingLookup } from "../upcoming_rides/useBookingLookup";

const LOCATION_POLL_INTERVAL_MILLISECONDS = 5000;

export function OngoingRidePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { rideBookingId } = useParams();
  const { booking, role } = useBookingLookup(rideBookingId);

  const [otpInput, setOtpInput] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  const trackingQuery = useQuery({
    queryKey: ["booking-tracking", rideBookingId],
    queryFn: () => getBookingTracking(rideBookingId as string),
    enabled: Boolean(rideBookingId),
    refetchInterval: LOCATION_POLL_INTERVAL_MILLISECONDS,
  });

  const tracking = trackingQuery.data;
  const tripStatus = tracking?.trip_status ?? booking?.trip_status ?? "BOOKED";

  // Driver device posts its location every 5 seconds while the trip is active.
  useEffect(() => {
    if (role !== "driver" || !booking) {
      return;
    }
    if (tripStatus !== "STARTED" && tripStatus !== "BOOKED") {
      return;
    }
    const offerId = booking.ride_offer_id;
    const fallbackPoint = {
      latitude: booking.pickup_latitude,
      longitude: booking.pickup_longitude,
    };

    function pushLocation(latitude: number, longitude: number) {
      postDriverLocation(offerId, latitude, longitude).catch(() => undefined);
    }

    function sampleAndPost() {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) =>
            pushLocation(
              position.coords.latitude,
              position.coords.longitude,
            ),
          () => pushLocation(fallbackPoint.latitude, fallbackPoint.longitude),
          { enableHighAccuracy: true, maximumAge: 4000, timeout: 4000 },
        );
      } else {
        pushLocation(fallbackPoint.latitude, fallbackPoint.longitude);
      }
    }

    sampleAndPost();
    const intervalId = window.setInterval(
      sampleAndPost,
      LOCATION_POLL_INTERVAL_MILLISECONDS,
    );
    return () => window.clearInterval(intervalId);
  }, [role, booking, tripStatus]);

  if (!booking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="animate-spin text-raahi-600" />
      </div>
    );
  }

  async function handleVerifyOtp() {
    if (!booking || otpInput.length !== 4) {
      toast.error("Enter the 4-digit OTP");
      return;
    }
    setIsVerifying(true);
    try {
      await verifyBookingOtp(booking.id, otpInput);
      await queryClient.invalidateQueries({ queryKey: ["driver-bookings"] });
      await trackingQuery.refetch();
      toast.success("Pickup confirmed — trip started");
      setOtpInput("");
    } catch (error) {
      toast.error(extractApiErrorMessage(error, "Incorrect OTP"));
    } finally {
      setIsVerifying(false);
    }
  }

  async function handleCompleteTrip() {
    if (!booking) {
      return;
    }
    setIsCompleting(true);
    try {
      await completeBooking(booking.id);
      await completeJourney(booking.ride_offer_id);
      await queryClient.invalidateQueries({ queryKey: ["driver-bookings"] });
      toast.success("Trip completed");
      navigate("/home", { replace: true });
    } catch (error) {
      toast.error(extractApiErrorMessage(error, "Could not complete the trip"));
    } finally {
      setIsCompleting(false);
    }
  }

  const driverLocation = tracking?.driver_location
    ? {
        lat: tracking.driver_location.latitude,
        lng: tracking.driver_location.longitude,
      }
    : null;

  return (
    <div className="min-h-screen pb-10">
      <EmployeeAppHeader title="Ongoing ride" />

      <div className="flex flex-col gap-4 px-4 py-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">
            {tracking?.driver_full_name ?? booking.driver_full_name}
          </span>
          <TripStatusPill status={tripStatus} />
        </div>

        <LiveTrackingMap
          driverLocation={driverLocation}
          pickup={{
            lat: booking.pickup_latitude,
            lng: booking.pickup_longitude,
          }}
          drop={{ lat: booking.drop_latitude, lng: booking.drop_longitude }}
        />

        <p className="text-sm text-text-secondary">
          {tripStatus === "STARTED"
            ? "On the way to the destination. Location updates every 5 seconds."
            : "Waiting for the driver to confirm pickup."}
        </p>

        {role === "passenger" &&
          tripStatus === "BOOKED" &&
          booking.otp_code && (
            <div className="rounded-2xl border border-raahi-200 bg-raahi-50 p-4 text-center">
              <p className="flex items-center justify-center gap-1 text-xs font-semibold uppercase tracking-wide text-raahi-700">
                <KeyRound size={12} /> Give this OTP to your driver
              </p>
              <p className="mt-1 text-4xl font-black tracking-[0.4em] text-raahi-800">
                {booking.otp_code}
              </p>
            </div>
          )}

        {role === "driver" && tripStatus === "BOOKED" && (
          <div className="rounded-2xl border border-[color:var(--color-border-primary)] p-4">
            <p className="mb-2 text-sm font-semibold">
              Enter {booking.passenger_full_name}'s OTP at pickup
            </p>
            <input
              inputMode="numeric"
              maxLength={4}
              value={otpInput}
              onChange={(event) =>
                setOtpInput(event.target.value.replace(/\D/g, ""))
              }
              placeholder="0000"
              className="mb-3 w-full rounded-xl border border-[color:var(--color-border-primary)] px-3 py-3 text-center text-2xl font-bold tracking-[0.5em] outline-none focus:border-raahi-500"
            />
            <PrimaryButton onClick={handleVerifyOtp} isLoading={isVerifying}>
              Verify OTP & start
            </PrimaryButton>
          </div>
        )}

        {role === "driver" && tripStatus === "STARTED" && (
          <PrimaryButton onClick={handleCompleteTrip} isLoading={isCompleting}>
            Complete trip
          </PrimaryButton>
        )}

        {tripStatus === "COMPLETED" && (
          <PrimaryButton onClick={() => navigate("/home")}>
            Back to home
          </PrimaryButton>
        )}
      </div>
    </div>
  );
}
