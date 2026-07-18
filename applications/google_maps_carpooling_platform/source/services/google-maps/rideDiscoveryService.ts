import type { Coordinates } from "../../types/google-maps/location";
import type { SelectedPlace } from "../../types/google-maps/places";
import type { RideDraft } from "../../types/google-maps/rideDraft";
import type {
  RideDiscoveryFilter,
  RideMarkerCluster,
  RidePreview,
} from "../../types/google-maps/rideDiscovery";
import type { RouteSummary } from "../../types/google-maps/routeSummary";
import { formatDuration } from "../../utilities/google-maps/routeFormatting";

const DEFAULT_DISCOVERY_FILTER: RideDiscoveryFilter = {
  maximumPickupDistanceKilometers: 12,
  minimumAvailableSeats: 1,
  vehicleSelectionPlaceholder: "any",
};

const CURATED_RIDE_PREVIEWS: RidePreview[] = [
  createCuratedRidePreview({
    availableSeatCount: 3,
    destination: {
      formattedAddress: "GIFT City, Gandhinagar, Gujarat",
      lat: 23.1586,
      lng: 72.6842,
      placeId: "demo-gift-city",
    },
    driverDisplayName: "Aarav",
    durationSeconds: 2100,
    pickup: {
      formattedAddress: "Prahlad Nagar, Ahmedabad, Gujarat",
      lat: 23.012,
      lng: 72.5078,
      placeId: "demo-prahlad-nagar",
    },
    ridePreviewId: "curated-demo-1",
    vehicleSelectionPlaceholder: "sedan",
  }),
  createCuratedRidePreview({
    availableSeatCount: 2,
    destination: {
      formattedAddress: "Infocity, Gandhinagar, Gujarat",
      lat: 23.1905,
      lng: 72.6326,
      placeId: "demo-infocity",
    },
    driverDisplayName: "Mira",
    durationSeconds: 2700,
    pickup: {
      formattedAddress: "Navrangpura, Ahmedabad, Gujarat",
      lat: 23.0396,
      lng: 72.566,
      placeId: "demo-navrangpura",
    },
    ridePreviewId: "curated-demo-2",
    vehicleSelectionPlaceholder: "compact-car",
  }),
  createCuratedRidePreview({
    availableSeatCount: 5,
    destination: {
      formattedAddress: "Sanand GIDC, Gujarat",
      lat: 22.9922,
      lng: 72.3812,
      placeId: "demo-sanand",
    },
    driverDisplayName: "Dev",
    durationSeconds: 2400,
    pickup: {
      formattedAddress: "Bopal, Ahmedabad, Gujarat",
      lat: 23.0339,
      lng: 72.4663,
      placeId: "demo-bopal",
    },
    ridePreviewId: "curated-demo-3",
    vehicleSelectionPlaceholder: "company-shuttle",
  }),
];

export function getDefaultRideDiscoveryFilter(): RideDiscoveryFilter {
  return DEFAULT_DISCOVERY_FILTER;
}

export function createRidePreviews({
  referenceLocation,
  rideDrafts,
}: {
  referenceLocation: Coordinates | null;
  rideDrafts: RideDraft[];
}): RidePreview[] {
  const sessionRidePreviews = rideDrafts.map((rideDraft, index) =>
    toSessionRidePreview({
      index,
      referenceLocation,
      rideDraft,
    }),
  );

  const curatedRidePreviews = CURATED_RIDE_PREVIEWS.map((ridePreview) => ({
    ...ridePreview,
    pickupDistanceKilometers: referenceLocation
      ? calculateDistanceKilometers(referenceLocation, ridePreview.pickup)
      : null,
  }));

  return [...sessionRidePreviews, ...curatedRidePreviews];
}

export function filterRidePreviews({
  filter,
  ridePreviews,
}: {
  filter: RideDiscoveryFilter;
  ridePreviews: RidePreview[];
}): RidePreview[] {
  return ridePreviews.filter((ridePreview) => {
    const doesVehicleMatch =
      filter.vehicleSelectionPlaceholder === "any" ||
      ridePreview.vehicleSelectionPlaceholder ===
        filter.vehicleSelectionPlaceholder;
    const doesSeatCountMatch =
      ridePreview.availableSeatCount >= filter.minimumAvailableSeats;
    const doesDistanceMatch =
      ridePreview.pickupDistanceKilometers == null ||
      ridePreview.pickupDistanceKilometers <=
        filter.maximumPickupDistanceKilometers;

    return doesVehicleMatch && doesSeatCountMatch && doesDistanceMatch;
  });
}

export function createRideMarkerClusters(
  ridePreviews: RidePreview[],
): RideMarkerCluster[] {
  const clustersByLocationKey = new Map<string, RideMarkerCluster>();

  ridePreviews.forEach((ridePreview) => {
    const locationKey = `${ridePreview.pickup.lat.toFixed(2)},${ridePreview.pickup.lng.toFixed(2)}`;
    const existingCluster = clustersByLocationKey.get(locationKey);

    if (existingCluster) {
      existingCluster.rideCount += 1;
      existingCluster.ridePreviewIds.push(ridePreview.ridePreviewId);
      return;
    }

    clustersByLocationKey.set(locationKey, {
      clusterId: `ride-cluster-${locationKey}`,
      position: ridePreview.pickup,
      rideCount: 1,
      ridePreviewIds: [ridePreview.ridePreviewId],
    });
  });

  return Array.from(clustersByLocationKey.values());
}

function toSessionRidePreview({
  index,
  referenceLocation,
  rideDraft,
}: {
  index: number;
  referenceLocation: Coordinates | null;
  rideDraft: RideDraft;
}): RidePreview {
  return {
    availableSeatCount: rideDraft.passengerCount,
    departureWindowLabel: "Session draft",
    destination: rideDraft.destination,
    driverDisplayName: "You",
    matchConfidenceLabel: "Draft",
    pickup: rideDraft.pickup,
    pickupDistanceKilometers: referenceLocation
      ? calculateDistanceKilometers(referenceLocation, rideDraft.pickup)
      : null,
    ridePreviewId: `session-preview-${rideDraft.rideDraftId}-${index}`,
    route: rideDraft.route,
    source: "session-draft",
    vehicleSelectionPlaceholder: rideDraft.vehicleSelectionPlaceholder,
  };
}

function createCuratedRidePreview({
  availableSeatCount,
  destination,
  driverDisplayName,
  durationSeconds,
  pickup,
  ridePreviewId,
  vehicleSelectionPlaceholder,
}: {
  availableSeatCount: number;
  destination: SelectedPlace;
  driverDisplayName: string;
  durationSeconds: number;
  pickup: SelectedPlace;
  ridePreviewId: string;
  vehicleSelectionPlaceholder: RidePreview["vehicleSelectionPlaceholder"];
}): RidePreview {
  const distanceKilometers = calculateDistanceKilometers(pickup, destination);
  const distanceMeters = Math.round(distanceKilometers * 1000);
  const route: RouteSummary = {
    cacheKey: `${ridePreviewId}-route`,
    distanceLabel: `${distanceKilometers.toFixed(1)} km`,
    distanceMeters,
    durationLabel: formatDuration(durationSeconds),
    durationSeconds,
    encodedPolyline: "",
    etaLabel: formatDuration(durationSeconds),
    isDefaultRoute: true,
    path: [pickup, destination],
    routeId: `${ridePreviewId}-route`,
    routeLabel: "DEFAULT_ROUTE",
    routeTitle: "Demo route",
    travelMode: "DRIVE",
  };

  return {
    availableSeatCount,
    departureWindowLabel: "Leaves soon",
    destination,
    driverDisplayName,
    matchConfidenceLabel: "Nearby",
    pickup,
    pickupDistanceKilometers: null,
    ridePreviewId,
    route,
    source: "curated-demo",
    vehicleSelectionPlaceholder,
  };
}

function calculateDistanceKilometers(
  firstLocation: Coordinates,
  secondLocation: Coordinates,
): number {
  const earthRadiusKilometers = 6371;
  const latitudeDelta =
    toRadians(secondLocation.lat - firstLocation.lat);
  const longitudeDelta =
    toRadians(secondLocation.lng - firstLocation.lng);
  const firstLatitude = toRadians(firstLocation.lat);
  const secondLatitude = toRadians(secondLocation.lat);
  const haversineValue =
    Math.sin(latitudeDelta / 2) * Math.sin(latitudeDelta / 2) +
    Math.cos(firstLatitude) *
      Math.cos(secondLatitude) *
      Math.sin(longitudeDelta / 2) *
      Math.sin(longitudeDelta / 2);

  return (
    earthRadiusKilometers *
    2 *
    Math.atan2(Math.sqrt(haversineValue), Math.sqrt(1 - haversineValue))
  );
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}
