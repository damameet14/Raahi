import type { Coordinates } from "./location";

export interface DrivingRouteCalculationRequest {
  apiKey: string;
  destination: Coordinates;
  origin: Coordinates;
  signal?: AbortSignal;
}

export interface RouteSummary {
  distanceLabel: string;
  distanceMeters: number;
  durationLabel: string;
  durationSeconds: number;
  encodedPolyline: string;
  etaLabel: string;
  path: Coordinates[];
}
