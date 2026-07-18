import { useMemo, useState } from "react";
import {
  createRideMarkerClusters,
  createRidePreviews,
  filterRidePreviews,
  getDefaultRideDiscoveryFilter,
} from "../../services/google-maps/rideDiscoveryService";
import type { Coordinates } from "../../types/google-maps/location";
import type { RideDraft } from "../../types/google-maps/rideDraft";
import type {
  RideDiscoveryFilter,
  RidePreview,
} from "../../types/google-maps/rideDiscovery";

interface UseRideDiscoveryOptions {
  referenceLocation: Coordinates | null;
  rideDrafts: RideDraft[];
}

export function useRideDiscovery({
  referenceLocation,
  rideDrafts,
}: UseRideDiscoveryOptions) {
  const [rideDiscoveryFilter, setRideDiscoveryFilter] =
    useState<RideDiscoveryFilter>(getDefaultRideDiscoveryFilter);
  const [selectedRidePreviewId, setSelectedRidePreviewId] = useState<
    string | null
  >(null);

  const ridePreviews = useMemo(
    () =>
      createRidePreviews({
        referenceLocation,
        rideDrafts,
      }),
    [referenceLocation, rideDrafts],
  );

  const filteredRidePreviews = useMemo(
    () =>
      filterRidePreviews({
        filter: rideDiscoveryFilter,
        ridePreviews,
      }),
    [rideDiscoveryFilter, ridePreviews],
  );

  const markerClusters = useMemo(
    () => createRideMarkerClusters(filteredRidePreviews),
    [filteredRidePreviews],
  );

  const selectedRidePreview =
    filteredRidePreviews.find(
      (ridePreview) => ridePreview.ridePreviewId === selectedRidePreviewId,
    ) ??
    filteredRidePreviews[0] ??
    null;

  function updateRideDiscoveryFilter(
    nextPartialFilter: Partial<RideDiscoveryFilter>,
  ): void {
    setRideDiscoveryFilter((currentFilter) => ({
      ...currentFilter,
      ...nextPartialFilter,
    }));
  }

  function previewRide(ridePreview: RidePreview): void {
    setSelectedRidePreviewId(ridePreview.ridePreviewId);
  }

  return {
    filteredRidePreviews,
    markerClusters,
    previewRide,
    rideDiscoveryFilter,
    selectedRidePreview,
    selectedRidePreviewId,
    updateRideDiscoveryFilter,
  };
}

