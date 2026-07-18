import { useMemo, useState } from "react";
import {
  createRideDraftFromInput,
  validateRideDraftInput,
} from "../../services/google-maps/rideDraftValidation";
import type { SelectedPlace } from "../../types/google-maps/places";
import type {
  RideDraft,
  VehicleSelectionPlaceholder,
} from "../../types/google-maps/rideDraft";
import type { RouteSummary } from "../../types/google-maps/routeSummary";

interface UseRideDraftOptions {
  destination: SelectedPlace | null;
  onRideDraftCreated: (rideDraft: RideDraft) => void;
  pickup: SelectedPlace | null;
  route: RouteSummary | null;
}

export function useRideDraft({
  destination,
  onRideDraftCreated,
  pickup,
  route,
}: UseRideDraftOptions) {
  const [passengerCount, setPassengerCount] = useState(1);
  const [vehicleSelectionPlaceholder, setVehicleSelectionPlaceholder] =
    useState<VehicleSelectionPlaceholder>("sedan");
  const [lastRideDraftMessage, setLastRideDraftMessage] = useState<string | null>(
    null,
  );

  const rideDraftInput = useMemo(
    () => ({
      destination,
      passengerCount,
      pickup,
      route,
      vehicleSelectionPlaceholder,
    }),
    [destination, passengerCount, pickup, route, vehicleSelectionPlaceholder],
  );

  const validationResult = useMemo(
    () => validateRideDraftInput(rideDraftInput),
    [rideDraftInput],
  );

  function createRideDraft(): void {
    const rideDraft = createRideDraftFromInput(rideDraftInput);
    onRideDraftCreated(rideDraft);
    setLastRideDraftMessage("Ride draft saved for this session.");
  }

  return {
    createRideDraft,
    lastRideDraftMessage,
    passengerCount,
    setPassengerCount,
    setVehicleSelectionPlaceholder,
    validationResult,
    vehicleSelectionPlaceholder,
  };
}

