import type { Coordinates } from "./location";
import type { RidePreview } from "./rideDiscovery";

export type TripTimelineStepStatus = "complete" | "current" | "upcoming";

export type TrackingAdapterStatus =
  | "not-connected"
  | "ready-for-backend"
  | "unavailable";

export interface TripTimelineStep {
  description: string;
  label: string;
  status: TripTimelineStepStatus;
}

export interface TripVisualizationState {
  destinationPosition: Coordinates;
  progressPercentage: number;
  ridePreview: RidePreview;
  routePath: Coordinates[];
  timelineSteps: TripTimelineStep[];
  trackingAdapterStatus: TrackingAdapterStatus;
}

export interface TripVisualizationRequest {
  ridePreview: RidePreview | null;
}

