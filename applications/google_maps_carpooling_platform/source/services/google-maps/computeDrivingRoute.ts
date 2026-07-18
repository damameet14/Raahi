import type { Coordinates } from "../../types/google-maps/location";
import type { RouteSummary } from "../../types/google-maps/routeSummary";

const COMPUTE_ROUTES_URL =
  "https://routes.googleapis.com/directions/v2:computeRoutes";
const ROUTE_FIELD_MASK =
  "routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline";

interface ComputeDrivingRouteOptions {
  apiKey: string;
  destination: Coordinates;
  origin: Coordinates;
  signal?: AbortSignal;
}

interface GoogleRoutesResponse {
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

export async function computeDrivingRoute({
  apiKey,
  destination,
  origin,
  signal,
}: ComputeDrivingRouteOptions): Promise<RouteSummary> {
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

  if (!response.ok) {
    throw new RouteCalculationError(
      "Routes API could not calculate a route. Check API access, billing, and browser key restrictions.",
    );
  }

  const data = (await response.json()) as GoogleRoutesResponse;
  const route = data.routes?.[0];
  const encodedPolyline = route?.polyline?.encodedPolyline;

  if (!route || !encodedPolyline || route.distanceMeters == null || !route.duration) {
    throw new RouteCalculationError(
      "Routes API did not return route distance, duration, and polyline.",
    );
  }

  const durationSeconds = parseDurationSeconds(route.duration);

  return {
    distanceLabel: formatDistance(route.distanceMeters),
    distanceMeters: route.distanceMeters,
    durationLabel: formatDuration(durationSeconds),
    durationSeconds,
    encodedPolyline,
    path: decodeEncodedPolyline(encodedPolyline),
  };
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
  const seconds = Number(duration.replace(/s$/, ""));

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
    byte = encodedPolyline.charCodeAt(index) - 63;
    index += 1;
    result |= (byte & 0x1f) << shift;
    shift += 5;
  } while (byte >= 0x20 && index < encodedPolyline.length);

  const value = result & 1 ? ~(result >> 1) : result >> 1;

  return {
    nextIndex: index,
    value,
  };
}
