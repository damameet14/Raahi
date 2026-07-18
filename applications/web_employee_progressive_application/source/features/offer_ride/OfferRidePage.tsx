/**
 * Offer a Ride (screens 2A–2C) — presented as a popup sheet over Home, not a
 * full screen. Step 2A — publish trip details from the driver's vehicle.
 * Step 2B.1 — pick matching passenger requests within the vehicle's
 * remaining seats (or see the "you'll be notified" message). Step 2C —
 * Confirm accepts the selected requests onto the offer and the journey
 * appears under My Rides.
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import { BottomSheet } from "../../shared_user_interface_infrastructure/reusable_components/BottomSheet";
import { useEmployeeProfileQuery } from "../../shared_user_interface_infrastructure/employee_profile/useEmployeeProfileQuery";
import { LocationSelectorField } from "../../shared_user_interface_infrastructure/maps/LocationSelectorField";
import { PrimaryButton } from "../../shared_user_interface_infrastructure/reusable_components/PrimaryButton";
import type { SelectedLocation } from "../../shared_user_interface_infrastructure/maps/types/selectedLocation";
import {
  createRideOffer,
  acceptRideRequests,
} from "../../shared_user_interface_infrastructure/backend_communication/employee_ride_api";
import type {
  MatchingRequest,
  VehicleSummary,
} from "../../shared_user_interface_infrastructure/backend_communication/employee_api_types";
import { extractApiErrorMessage } from "../../shared_user_interface_infrastructure/backend_communication/extractApiErrorMessage";
import { RecurringDaysSelector } from "../shared_ride_form/RecurringDaysSelector";
import { MatchingRequestCard } from "./MatchingRequestCard";

type OfferRideStep = "details" | "requests";

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function OfferRidePage() {
  const navigate = useNavigate();
  const profileQuery = useEmployeeProfileQuery();
  const vehicles: VehicleSummary[] = profileQuery.data?.vehicles ?? [];

  const [step, setStep] = useState<OfferRideStep>("details");
  const [source, setSource] = useState<SelectedLocation | null>(null);
  const [destination, setDestination] = useState<SelectedLocation | null>(null);
  const [travelDate, setTravelDate] = useState(todayIsoDate());
  const [windowStart, setWindowStart] = useState("08:30");
  const [windowEnd, setWindowEnd] = useState("09:30");
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringDays, setRecurringDays] = useState<string[]>([]);

  const [rideOfferId, setRideOfferId] = useState<string | null>(null);
  const [seatsAvailable, setSeatsAvailable] = useState(0);
  const [matchingRequests, setMatchingRequests] = useState<MatchingRequest[]>([]);
  const [selectedRequestIds, setSelectedRequestIds] = useState<string[]>([]);
  const [isBusy, setIsBusy] = useState(false);

  function closeSheet() {
    navigate("/home");
  }

  const profile = profileQuery.data;
  if (profile && source === null && profile.home_latitude != null) {
    setSource({
      latitude: profile.home_latitude,
      longitude: profile.home_longitude as number,
      label: profile.home_address_label ?? "Home",
    });
  }
  if (profile && destination === null && profile.office_latitude != null) {
    setDestination({
      latitude: profile.office_latitude,
      longitude: profile.office_longitude as number,
      label: profile.office_address_label ?? "Office",
    });
  }
  if (vehicles.length > 0 && selectedVehicleId === "") {
    setSelectedVehicleId(vehicles[0]!.id);
  }

  const selectedSeatsTotal = matchingRequests
    .filter((request) => selectedRequestIds.includes(request.ride_request_id))
    .reduce((sum, request) => sum + request.seats_requested, 0);

  async function handleConfirmOffer() {
    if (!source || !destination) {
      toast.error("Select your route");
      return;
    }
    if (!selectedVehicleId) {
      toast.error("Select a vehicle");
      return;
    }
    if (windowEnd < windowStart) {
      toast.error("End time must be after start time");
      return;
    }
    setIsBusy(true);
    try {
      const result = await createRideOffer({
        vehicle_id: selectedVehicleId,
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
        departure_window_start_time: windowStart,
        departure_window_end_time: windowEnd,
        seats_offered: null,
        is_recurring: isRecurring,
        recurrence_days: isRecurring ? recurringDays : null,
        recurrence_time: isRecurring ? windowStart : null,
      });
      setRideOfferId(result.ride_offer.id);
      setSeatsAvailable(result.ride_offer.seats_available);
      setMatchingRequests(result.matching_requests);
      setStep("requests");
    } catch (error) {
      toast.error(extractApiErrorMessage(error, "Could not publish the ride"));
    } finally {
      setIsBusy(false);
    }
  }

  function toggleRequest(request: MatchingRequest) {
    const isCurrentlySelected = selectedRequestIds.includes(
      request.ride_request_id,
    );
    if (isCurrentlySelected) {
      setSelectedRequestIds((current) =>
        current.filter((id) => id !== request.ride_request_id),
      );
      return;
    }
    if (selectedSeatsTotal + request.seats_requested > seatsAvailable) {
      toast.error("Not enough seats left for this request");
      return;
    }
    setSelectedRequestIds((current) => [...current, request.ride_request_id]);
  }

  async function handleConfirmSelection() {
    if (!rideOfferId) {
      return;
    }
    if (selectedRequestIds.length === 0) {
      toast("You will be notified once a new ride arrives");
      navigate("/home");
      return;
    }
    setIsBusy(true);
    try {
      await acceptRideRequests(rideOfferId, selectedRequestIds);
      toast.success("Passengers added to your journey");
      navigate("/rides", { replace: true });
    } catch (error) {
      toast.error(extractApiErrorMessage(error, "Could not accept requests"));
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <BottomSheet
      isOpen
      onClose={closeSheet}
      title="Offer a Ride"
      footer={
        step === "details" ? (
          <PrimaryButton onClick={handleConfirmOffer} isLoading={isBusy}>
            Confirm
          </PrimaryButton>
        ) : step === "requests" && matchingRequests.length > 0 ? (
          <PrimaryButton onClick={handleConfirmSelection} isLoading={isBusy}>
            {selectedRequestIds.length > 0
              ? `Confirm ${selectedRequestIds.length} passenger${
                  selectedRequestIds.length > 1 ? "s" : ""
                }`
              : "Confirm"}
          </PrimaryButton>
        ) : undefined
      }
    >
      {step === "details" && (
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-xs font-semibold text-text-secondary">
            Vehicle
            <select
              value={selectedVehicleId}
              onChange={(event) => setSelectedVehicleId(event.target.value)}
              className="rounded-xl border border-[color:var(--color-border-primary)] bg-white px-3 py-3 text-sm outline-none focus:border-raahi-500"
            >
              {vehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.make} {vehicle.model} · {vehicle.vehicle_number} (
                  {vehicle.maximum_passengers} seats)
                </option>
              ))}
            </select>
          </label>

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
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-xs font-semibold text-text-secondary">
              Earliest departure
              <input
                type="time"
                value={windowStart}
                onChange={(event) => setWindowStart(event.target.value)}
                className="rounded-xl border border-[color:var(--color-border-primary)] bg-white px-3 py-3 text-sm outline-none focus:border-raahi-500"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-semibold text-text-secondary">
              Latest departure
              <input
                type="time"
                value={windowEnd}
                onChange={(event) => setWindowEnd(event.target.value)}
                className="rounded-xl border border-[color:var(--color-border-primary)] bg-white px-3 py-3 text-sm outline-none focus:border-raahi-500"
              />
            </label>
          </div>

          <RecurringDaysSelector
            isRecurring={isRecurring}
            onToggle={setIsRecurring}
            selectedDays={recurringDays}
            onDaysChange={setRecurringDays}
          />
        </div>
      )}

      {step === "requests" && (
        <div className="flex flex-col gap-4">
          {matchingRequests.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[color:var(--color-border-secondary)] bg-surface-secondary p-6 text-center">
              <p className="text-sm font-medium">
                You will be notified once a new ride arrives.
              </p>
              <p className="mt-1 text-xs text-text-muted">
                Your offer is saved under Menu → My Rides → Ride Offers.
              </p>
              <PrimaryButton
                variant="secondary"
                className="mt-4"
                onClick={closeSheet}
              >
                Back to home
              </PrimaryButton>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Suggested rides</p>
                <p className="text-xs text-text-muted">
                  {selectedSeatsTotal}/{seatsAvailable} seats selected
                </p>
              </div>
              <div className="flex flex-col gap-3">
                {matchingRequests.map((request) => (
                  <MatchingRequestCard
                    key={request.ride_request_id}
                    request={request}
                    isSelected={selectedRequestIds.includes(
                      request.ride_request_id,
                    )}
                    onToggle={() => toggleRequest(request)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </BottomSheet>
  );
}
