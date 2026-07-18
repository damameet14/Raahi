import type { SelectedPlace } from "./places";
import type { RouteSummary } from "./routeSummary";

export type VehicleSelectionPlaceholder =
  | "compact-car"
  | "sedan"
  | "suv"
  | "company-shuttle";

export interface RideDraft {
  createdAtIsoString: string;
  destination: SelectedPlace;
  passengerCount: number;
  pickup: SelectedPlace;
  rideDraftId: string;
  route: RouteSummary;
  vehicleSelectionPlaceholder: VehicleSelectionPlaceholder;
}

export interface RideDraftInput {
  destination: SelectedPlace | null;
  passengerCount: number;
  pickup: SelectedPlace | null;
  route: RouteSummary | null;
  vehicleSelectionPlaceholder: VehicleSelectionPlaceholder;
}

export interface RideValidationResult {
  errorMessages: string[];
  isValid: boolean;
}

