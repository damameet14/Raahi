import type { Coordinates } from "../../types/google-maps/location";
import type {
  DrivingRouteCalculationRequest,
  RouteSummary,
} from "../../types/google-maps/routeSummary";

const COMPUTE_ROUTES_URL =
  "https://routes.googleapis.com/directions/v2:computeRoutes";
const ROUTE_FIELD_MASK =
  "routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline";

interface GoogleRoutesResponse {
  error?: {
    message?: string;
    status?: string;
  };
  routes?: GoogleRoute[];
}

interface GoogleRoute {
  distanceMeters?: number;
  duration?: string;
  polyline?: {
    encodedPolyline?: string;
  };
}

export class RouteCalculationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RouteCalculationError";
  }
}

export class InvalidRouteInputError extends RouteCalculationError {
  constructor(message: string) {
    super(message);
    this.name = "InvalidRouteInputError";
  }
}

export class RouteNotFoundError extends RouteCalculationError {
  constructor(message = "No driving route was found for these locations.") {
    super(message);
    this.name = "RouteNotFoundError";
  }
}

export async function computeDrivingRoute({
  apiKey,
  destination,
  origin,
  signal,
}: DrivingRouteCalculationRequest): Promise<RouteSummary> {
  validateDrivingRouteCalculationRequest({
    apiKey,
    destination,
    origin,
    signal,
  });

  const response = await fetch(COMPUTE_ROUTES_URL, {
    body: JSON.stringify({
      computeAlternativeRoutes: false,
      destination: toRouteWaypoint(destination),
      languageCode: "en-US",
      origin: toRouteWaypoint(origin),
      polylineEncoding: "ENCODED_POLYLINE",
      polylineQuality: "OVERVIEW",
      routingPreference: "TRAFFIC_AWARE",
      travelMode: "DRIVE",
      units: "METRIC",
    }),
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": ROUTE_FIELD_MASK,
    },
    method: "POST",
    signal,
  });

  const data = (await response.json().catch(() => null)) as
    | GoogleRoutesResponse
    | null;

  if (!response.ok) {
    throw new RouteCalculationError(
      data?.error?.message ??
        "Routes API could not calculate a route. Check API access, billing, and browser key restrictions.",
    );
  }

  const route = data?.routes?.[0];
  const encodedPolyline = route?.polyline?.encodedPolyline;

  if (!route) {
    throw new RouteNotFoundError();
  }

  if (!encodedPolyline || route.distanceMeters == null || !route.duration) {
    throw new RouteNotFoundError(
      "Routes API did not return a complete drawable route.",
    );
  }

  const durationSeconds = parseDurationSeconds(route.duration);
  const durationLabel = formatDuration(durationSeconds);
  const path = decodeEncodedPolyline(encodedPolyline);

  if (path.length === 0) {
    throw new RouteNotFoundError(
      "Routes API returned an empty route path for these locations.",
    );
  }

  return {
    distanceLabel: formatDistance(route.distanceMeters),
    distanceMeters: route.distanceMeters,
    durationLabel,
    durationSeconds,
    encodedPolyline,
    etaLabel: durationLabel,
    path,
  };
}

function validateDrivingRouteCalculationRequest({
  apiKey,
  destination,
  origin,
}: DrivingRouteCalculationRequest): void {
  if (!apiKey.trim()) {
    throw new InvalidRouteInputError("Google Maps API key is missing.");
  }

  if (!areCoordinatesValid(origin) || !areCoordinatesValid(destination)) {
    throw new InvalidRouteInputError(
      "Pickup and destination must include valid coordinates.",
    );
  }

  if (origin.lat === destination.lat && origin.lng === destination.lng) {
    throw new InvalidRouteInputError(
      "Pickup and destination must be different locations.",
    );
  }
}

function areCoordinatesValid(coordinates: Coordinates): boolean {
  return (
    Number.isFinite(coordinates.lat) &&
    Number.isFinite(coordinates.lng) &&
    coordinates.lat >= -90 &&
    coordinates.lat <= 90 &&
    coordinates.lng >= -180 &&
    coordinates.lng <= 180
  );
}

function toRouteWaypoint(coordinates: Coordinates) {
  return {
    location: {
      latLng: {
        latitude: coordinates.lat,
        longitude: coordinates.lng,
      },
    },
  };
}

function parseDurationSeconds(duration: string): number {
  if (!duration.endsWith("s")) {
    throw new RouteCalculationError("Routes API returned an invalid duration.");
  }

  const seconds = Number(duration.slice(0, -1));

  if (!Number.isFinite(seconds)) {
    throw new RouteCalculationError("Routes API returned an invalid duration.");
  }

  return Math.round(seconds);
}

function formatDistance(distanceMeters: number): string {
  if (distanceMeters < 1000) {
    return `${distanceMeters} m`;
  }

  return `${(distanceMeters / 1000).toFixed(1)} km`;
}

function formatDuration(durationSeconds: number): string {
  const hours = Math.floor(durationSeconds / 3600);
  const minutes = Math.max(1, Math.round((durationSeconds % 3600) / 60));

  if (hours === 0) {
    return `${minutes} min`;
  }

  return `${hours} hr ${minutes} min`;
}

function decodeEncodedPolyline(encodedPolyline: string): Coordinates[] {
  const path: Coordinates[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encodedPolyline.length) {
    const latitudeResult = decodeNextValue(encodedPolyline, index);
    lat += latitudeResult.value;
    index = latitudeResult.nextIndex;

    const longitudeResult = decodeNextValue(encodedPolyline, index);
    lng += longitudeResult.value;
    index = longitudeResult.nextIndex;

    path.push({
      lat: lat / 100_000,
      lng: lng / 100_000,
    });
  }

  return path;
}

function decodeNextValue(
  encodedPolyline: string,
  startIndex: number,
): { nextIndex: number; value: number } {
  let index = startIndex;
  let result = 0;
  let shift = 0;
  let byte: number;

  do {
    if (index >= encodedPolyline.length) {
      throw new RouteNotFoundError(
        "Routes API returned an invalid route path.",
      );
    }

    byte = encodedPolyline.charCodeAt(index) - 63;
    index += 1;
    result |= (byte & 0x1f) << shift;
    shift += 5;
  } while (byte >= 0x20);

  const value = result & 1 ? ~(result >> 1) : result >> 1;

  return {
    nextIndex: index,
    value,
  };
}
