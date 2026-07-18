import type {
  TripTimelineStep,
  TripVisualizationRequest,
  TripVisualizationState,
} from "../../types/google-maps/tripVisualization";

export function createTripVisualizationState({
  ridePreview,
}: TripVisualizationRequest): TripVisualizationState | null {
  if (!ridePreview) {
    return null;
  }

  const timelineSteps: TripTimelineStep[] = [
    {
      description: ridePreview.pickup.formattedAddress,
      label: "Pickup",
      status: "complete",
    },
    {
      description: ridePreview.departureWindowLabel,
      label: "On the way",
      status: "current",
    },
    {
      description: ridePreview.destination.formattedAddress,
      label: "Destination",
      status: "upcoming",
    },
  ];

  return {
    destinationPosition: ridePreview.destination,
    progressPercentage: ridePreview.source === "session-draft" ? 15 : 42,
    ridePreview,
    routePath: ridePreview.route.path,
    timelineSteps,
    trackingAdapterStatus: "ready-for-backend",
  };
}

