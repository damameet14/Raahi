import { describe, expect, it } from "vitest";
import type { SelectedPlace } from "../../types/google-maps/places";
import type { RouteSummary } from "../../types/google-maps/routeSummary";
import {
  createRideDraftFromInput,
  validateRideDraftInput,
} from "./rideDraftValidation";

const pickup: SelectedPlace = {
  formattedAddress: "Pickup",
  lat: 23.02,
  lng: 72.57,
  placeId: "pickup",
};

const destination: SelectedPlace = {
  formattedAddress: "Destination",
  lat: 23.05,
  lng: 72.6,
  placeId: "destination",
};

const route: RouteSummary = {
  cacheKey: "route-cache",
  distanceLabel: "5.0 km",
  distanceMeters: 5000,
  durationLabel: "12 min",
  durationSeconds: 720,
  encodedPolyline: "",
  etaLabel: "12 min",
  isDefaultRoute: true,
  path: [pickup, destination],
  routeId: "route-1",
  routeLabel: "DEFAULT_ROUTE",
  routeTitle: "Best route",
  travelMode: "DRIVE",
};

describe("rideDraftValidation", () => {
  it("rejects incomplete ride draft inputs", () => {
    const validationResult = validateRideDraftInput({
      destination: null,
      passengerCount: 1,
      pickup,
      route: null,
      vehicleSelectionPlaceholder: "sedan",
    });

    expect(validationResult.isValid).toBe(false);
    expect(validationResult.errorMessages).toContain("Choose a destination.");
  });

  it("creates a session ride draft from valid inputs", () => {
    const rideDraft = createRideDraftFromInput({
      destination,
      passengerCount: 2,
      pickup,
      route,
      vehicleSelectionPlaceholder: "sedan",
    });

    expect(rideDraft.passengerCount).toBe(2);
    expect(rideDraft.route.routeId).toBe("route-1");
  });
});

