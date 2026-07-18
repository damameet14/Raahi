import type { Coordinates } from "./location";

export interface RouteSummary {
  distanceLabel: string;
  distanceMeters: number;
  durationLabel: string;
  durationSeconds: number;
  encodedPolyline: string;
  path: Coordinates[];
}
