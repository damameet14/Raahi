/**
 * Find a Ride (screens 1A–1C).
 *
 * Step 1A — enter trip details. Step 1B — confirm route and fare. Step 1B.1 —
 * pick from matching offers (or see the "you'll be notified" message). Step 1C
 * — Select Ride books the offer and opens the confirmed ride's details.
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowLeft } from "lucide-react";

import { EmployeeAppHeader } from "../../shared_user_interface_infrastructure/layout/EmployeeAppHeader";
import { useEmployeeProfileQuery } from "../../shared_user_interface_infrastructure/employee_profile/useEmployeeProfileQuery";
import { LocationSelectorField } from "../../shared_user_interface_infrastructure/maps/LocationSelectorField";
import { RoutePreviewMap } from "../../shared_user_interface_infrastructure/maps/RoutePreviewMap";
import { PrimaryButton } from "../../shared_user_interface_infrastructure/reusable_components/PrimaryButton";
import type { SelectedLocation } from "../../shared_user_interface_infrastructure/maps/types/selectedLocation";
import {
  estimateFare,
  createRideRequest,
  bookOffer,
} from "../../shared_user_interface_infrastructure/backend_communication/employee_ride_api";
import type {
  FareEstimateResponse,
  MatchingOffer,
} from "../../shared_user_interface_infrastructure/backend_communication/employee_api_types";
import { extractApiErrorMessage } from "../../shared_user_interface_infrastructure/backend_communication/extractApiErrorMessage";
import { RecurringDaysSelector } from "../shared_ride_form/RecurringDaysSelector";
import { MatchingOfferCard } from "./MatchingOfferCard";

type FindRideStep = "details" | "fareConfirm" | "offers";

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function FindRidePage() {
  const navigate = useNavigate();
  const profileQuery = useEmployeeProfileQuery();

  const [step, setStep] = useState<FindRideStep>("details");
  const [source, setSource] = useState<SelectedLocation | null>(null);
  const [destination, setDestination] = useState<SelectedLocation | null>(null);
  const [travelDate, setTravelDate] = useState(todayIsoDate());
  const [departureTime, setDepartureTime] = useState("09:00");
  const [seats, setSeats] = useState(1);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringDays, setRecurringDays] = useState<string[]>([]);

  const [fareEstimate, setFareEstimate] = useState<FareEstimateResponse | null>(
    null,
  );
  const [matchingOffers, setMatchingOffers] = useState<MatchingOffer[]>([]);
  const [rideRequestId, setRideRequestId] = useState<string | null>(null);
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  // Prefill source with the employee's saved home once the profile loads.
  const profile = profileQuery.data;
  if (profile && source === null && profile.home_latitude != null) {
    setSource({
      latitude: profile.home_latitude,
      longitude: profile.home_longitude as number,
      label: "Home",
    });
  }
  if (profile && destination === null && profile.office_latitude != null) {
    setDestination({
      latitude: profile.office_latitude,
      longitude: profile.office_longitude as number,
      label: "Office",
    });
  }

  async function handleConfirmRequest() {
    if (!source || !destination) {
      toast.error("Select your pickup and destination");
      return;
    }
    setIsBusy(true);
    try {
      const estimate = await estimateFare(
        { latitude: source.latitude, longitude: source.longitude },
        { latitude: destination.latitude, longitude: destination.longitude },
        seats,
      );
      setFareEstimate(estimate);
      setStep("fareConfirm");
    } catch (error) {
      toast.error(extractApiErrorMessage(error, "Could not estimate the fare"));
    } finally {
      setIsBusy(false);
    }
  }

  async function handleConfirmFare() {
    if (!source || !destination) {
      return;
    }
    setIsBusy(true);
    try {
      const result = await createRideRequest({
        source: {
          latitude: source.latitude,
          longitude: source.longitude,
          label: source.label,
        },
        destination: {
          latitude: destination.latitude,
          longitude: destination.longitude,
          label: destination.label,
        },
        travel_date: travelDate,
        departure_time: departureTime,
        seats_requested: seats,
        is_recurring: isRecurring,
        recurrence_days: isRecurring ? recurringDays : null,
        recurrence_time: isRecurring ? departureTime : null,
      });
      setRideRequestId(result.ride_request.id);
      setMatchingOffers(result.matching_offers);
      setStep("offers");
    } catch (error) {
      toast.error(extractApiErrorMessage(error, "Could not create the request"));
    } finally {
      setIsBusy(false);
    }
  }

  async function handleSelectRide() {
    if (!rideRequestId || !selectedOfferId) {
      return;
    }
    setIsBusy(true);
    try {
      const booking = await bookOffer(rideRequestId, selectedOfferId);
      toast.success("Ride confirmed!");
      navigate(`/rides/upcoming/${booking.id}`, { replace: true });
    } catch (error) {
      toast.error(extractApiErrorMessage(error, "Could not book this ride"));
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <div className="min-h-screen pb-28">
      <EmployeeAppHeader title="Find a Ride" />

      {step === "details" && (
        <div className="flex flex-col gap-4 px-4 py-4">
          <LocationSelectorField
            label="Pickup"
            value={source}
            onChange={setSource}
            placeholder="Where from?"
          />
          <LocationSelectorField
            label="Destination"
            value={destination}
            onChange={setDestination}
            placeholder="Where to?"
          />
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-xs font-semibold text-text-secondary">
              Date
              <input
                type="date"
                value={travelDate}
                min={todayIsoDate()}
                onChange={(event) => setTravelDate(event.target.value)}
                className="rounded-xl border border-[color:var(--color-border-primary)] bg-white px-3 py-3 text-sm outline-none focus:border-raahi-500"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-semibold text-text-secondary">
              Time
              <input
                type="time"
                value={departureTime}
                onChange={(event) => setDepartureTime(event.target.value)}
                className="rounded-xl border border-[color:var(--color-border-primary)] bg-white px-3 py-3 text-sm outline-none focus:border-raahi-500"
              />
            </label>
          </div>
          <label className="flex flex-col gap-1 text-xs font-semibold text-text-secondary">
            Seats
            <input
              type="number"
              min={1}
              max={6}
              value={seats}
              onChange={(event) => setSeats(Number(event.target.value))}
              className="rounded-xl border border-[color:var(--color-border-primary)] bg-white px-3 py-3 text-sm outline-none focus:border-raahi-500"
            />
          </label>

          <RecurringDaysSelector
            isRecurring={isRecurring}
            onToggle={setIsRecurring}
            selectedDays={recurringDays}
            onDaysChange={setRecurringDays}
          />

          <PrimaryButton
            onClick={handleConfirmRequest}
            isLoading={isBusy}
            className="mt-2"
          >
            Confirm Request
          </PrimaryButton>
        </div>
      )}

      {step === "fareConfirm" && source && destination && fareEstimate && (
        <div className="flex flex-col gap-4 px-4 py-4">
          <button
            type="button"
            onClick={() => setStep("details")}
            className="flex items-center gap-1 text-sm text-text-secondary"
          >
            <ArrowLeft size={16} /> Edit details
          </button>
          <RoutePreviewMap
            origin={{ lat: source.latitude, lng: source.longitude }}
            destination={{
              lat: destination.latitude,
              lng: destination.longitude,
            }}
          />
          <div className="rounded-2xl border border-[color:var(--color-border-primary)] p-4">
            <p className="text-xs uppercase tracking-wide text-text-muted">
              Estimated fare
            </p>
            <p className="text-3xl font-extrabold">
              {fareEstimate.currency} {fareEstimate.fare_amount.toFixed(2)}
            </p>
            <p className="mt-1 text-sm text-text-secondary">
              {fareEstimate.distance_kilometers.toFixed(1)} km · {seats} seat
              {seats > 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex gap-3">
            <PrimaryButton
              variant="secondary"
              onClick={() => navigate("/home")}
            >
              Cancel
            </PrimaryButton>
            <PrimaryButton onClick={handleConfirmFare} isLoading={isBusy}>
              Ok, find rides
            </PrimaryButton>
          </div>
        </div>
      )}

      {step === "offers" && (
        <div className="flex flex-col gap-4 px-4 py-4">
          {matchingOffers.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[color:var(--color-border-secondary)] bg-surface-secondary p-6 text-center">
              <p className="text-sm font-medium">
                You will be notified when a ride matches.
              </p>
              <p className="mt-1 text-xs text-text-muted">
                Your request is saved under Menu → My Rides → Ride Requests.
              </p>
              <PrimaryButton
                variant="secondary"
                className="mt-4"
                onClick={() => navigate("/home")}
              >
                Back to home
              </PrimaryButton>
            </div>
          ) : (
            <>
              <p className="text-sm font-semibold">
                {matchingOffers.length} ride
                {matchingOffers.length > 1 ? "s" : ""} available
              </p>
              <div className="flex flex-col gap-3">
                {matchingOffers.map((offer) => (
                  <MatchingOfferCard
                    key={offer.ride_offer_id}
                    offer={offer}
                    isSelected={selectedOfferId === offer.ride_offer_id}
                    onSelect={() => setSelectedOfferId(offer.ride_offer_id)}
                  />
                ))}
              </div>
              <div className="fixed inset-x-0 bottom-0 mx-auto max-w-[480px] border-t border-[color:var(--color-border-primary)] bg-white p-4">
                <PrimaryButton
                  onClick={handleSelectRide}
                  isLoading={isBusy}
                  disabled={!selectedOfferId}
                >
                  Select Ride
                </PrimaryButton>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
