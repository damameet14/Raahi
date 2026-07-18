import { useMemo } from "react";
import { createTripVisualizationState } from "../../services/google-maps/tripVisualizationService";
import type { RidePreview } from "../../types/google-maps/rideDiscovery";

interface UseTripVisualizationOptions {
  ridePreview: RidePreview | null;
}

export function useTripVisualization({
  ridePreview,
}: UseTripVisualizationOptions) {
  return useMemo(
    () =>
      createTripVisualizationState({
        ridePreview,
      }),
    [ridePreview],
  );
}

