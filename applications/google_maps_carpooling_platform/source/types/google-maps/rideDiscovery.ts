import type { Coordinates } from "./location";
import type { SelectedPlace } from "./places";
import type { RideDraft, VehicleSelectionPlaceholder } from "./rideDraft";
import type { RouteSummary } from "./routeSummary";

export type RidePreviewSource = "curated-demo" | "session-draft";

export interface RideDiscoveryFilter {
  maximumPickupDistanceKilometers: number;
  minimumAvailableSeats: number;
  vehicleSelectionPlaceholder: VehicleSelectionPlaceholder | "any";
}

export interface RidePreview {
  availableSeatCount: number;
  departureWindowLabel: string;
  destination: SelectedPlace;
  driverDisplayName: string;
  matchConfidenceLabel: string;
  pickup: SelectedPlace;
  pickupDistanceKilometers: number | null;
  ridePreviewId: string;
  route: RouteSummary;
  source: RidePreviewSource;
  vehicleSelectionPlaceholder: VehicleSelectionPlaceholder;
}

export interface RideMarkerCluster {
  clusterId: string;
  position: Coordinates;
  rideCount: number;
  ridePreviewIds: string[];
}

export interface RideDiscoveryResult {
  filteredRidePreviews: RidePreview[];
  markerClusters: RideMarkerCluster[];
  selectedRidePreview: RidePreview | null;
}

export interface SessionRideCollection {
  rideDrafts: RideDraft[];
}

