import type { Coordinates } from "../../types/google-maps/location";
import type {
  DrivingRouteCalculationRequest,
  RouteCalculationResult,
  RouteLabel,
  RouteSummary,
  RouteTravelMode,
} from "../../types/google-maps/routeSummary";
import {
  formatDistance,
  formatDuration,
} from "../../utilities/google-maps/routeFormatting";
import { createRouteCalculationCacheKey } from "./routeCalculationCache";

const COMPUTE_ROUTES_URL =
  "https://routes.googleapis.com/directions/v2:computeRoutes";
const ROUTE_FIELD_MASK =
  "routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline,routes.routeLabels";

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
  routeLabels?: RouteLabel[];
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

export async function computeDrivingRoute(
  request: DrivingRouteCalculationRequest,
): Promise<RouteSummary> {
  const result = await computeRouteCalculationResult(request);
  const route = result.routes[0];

  if (!route) {
    throw new RouteNotFoundError();
  }

  return route;
}

export async function computeRouteCalculationResult({
  apiKey,
  cacheKey,
  destination,
  intermediateWaypoints = [],
  origin,
  shouldComputeAlternativeRoutes = false,
  signal,
  travelMode = "DRIVE",
}: DrivingRouteCalculationRequest): Promise<RouteCalculationResult> {
  validateDrivingRouteCalculationRequest({
    apiKey,
    cacheKey,
    destination,
    intermediateWaypoints,
    origin,
    shouldComputeAlternativeRoutes,
    signal,
    travelMode,
  });

  const routeCacheKey =
    cacheKey ??
    createRouteCalculationCacheKey({
      apiKey,
      destination,
      intermediateWaypoints,
      origin,
      shouldComputeAlternativeRoutes,
      signal,
      travelMode,
    });

  const response = await fetch(COMPUTE_ROUTES_URL, {
    body: JSON.stringify({
      computeAlternativeRoutes:
        shouldComputeAlternativeRoutes && intermediateWaypoints.length === 0,
      destination: toRouteWaypoint(destination),
      intermediates: intermediateWaypoints.map(toRouteWaypoint),
      languageCode: "en-US",
      origin: toRouteWaypoint(origin),
      polylineEncoding: "ENCODED_POLYLINE",
      polylineQuality: "OVERVIEW",
      routingPreference: "TRAFFIC_AWARE",
      travelMode,
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

  const routesApiResponse = (await response.json().catch(() => null)) as
    | GoogleRoutesResponse
    | null;

  if (!response.ok) {
    throw new RouteCalculationError(
      routesApiResponse?.error?.message ??
        "Routes API could not calculate a route. Check API access, billing, and browser key restrictions.",
    );
  }

  const routes = routesApiResponse?.routes ?? [];

  if (routes.length === 0) {
    throw new RouteNotFoundError();
  }

  const normalizedRoutes = routes.map((route, index) =>
    toRouteSummary({
      cacheKey: routeCacheKey,
      index,
      route,
      travelMode,
    }),
  );

  return {
    cacheKey: routeCacheKey,
    routeStatus: "ready",
    routes: normalizedRoutes,
    selectedRouteId: normalizedRoutes[0]?.routeId ?? null,
  };
}

export function validateDrivingRouteCalculationRequest({
  apiKey,
  destination,
  origin,
  travelMode = "DRIVE",
}: DrivingRouteCalculationRequest): void {
  if (!apiKey.trim()) {
    throw new InvalidRouteInputError("Google Maps API key is missing.");
  }

  if (!isRouteTravelModeSupported(travelMode)) {
    throw new InvalidRouteInputError("Selected travel mode is not supported.");
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

export function areCoordinatesValid(coordinates: Coordinates): boolean {
  return (
    Number.isFinite(coordinates.lat) &&
    Number.isFinite(coordinates.lng) &&
    coordinates.lat >= -90 &&
    coordinates.lat <= 90 &&
    coordinates.lng >= -180 &&
    coordinates.lng <= 180
  );
}

function toRouteSummary({
  cacheKey,
  index,
  route,
  travelMode,
}: {
  cacheKey: string;
  index: number;
  route: GoogleRoute;
  travelMode: RouteTravelMode;
}): RouteSummary {
  const encodedPolyline = route.polyline?.encodedPolyline;

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
    cacheKey,
    distanceLabel: formatDistance(route.distanceMeters),
    distanceMeters: route.distanceMeters,
    durationLabel,
    durationSeconds,
    encodedPolyline,
    etaLabel: durationLabel,
    isDefaultRoute: index === 0,
    path,
    routeId: `${cacheKey}::route-${index}`,
    routeLabel: route.routeLabels?.[0] ?? toFallbackRouteLabel(index),
    routeTitle: toRouteTitle(route.routeLabels?.[0], index),
    travelMode,
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

function isRouteTravelModeSupported(travelMode: RouteTravelMode): boolean {
  return ["DRIVE", "WALK", "BICYCLE", "TWO_WHEELER"].includes(travelMode);
}

function toFallbackRouteLabel(index: number): RouteLabel {
  return index === 0 ? "DEFAULT_ROUTE" : "DEFAULT_ROUTE_ALTERNATE";
}

function toRouteTitle(routeLabel: RouteLabel | undefined, index: number): string {
  if (routeLabel === "DEFAULT_ROUTE") {
    return "Best route";
  }

  if (routeLabel === "FUEL_EFFICIENT") {
    return "Fuel efficient route";
  }

  if (routeLabel === "SHORTER_DISTANCE") {
    return "Shorter route";
  }

  return `Alternative ${index}`;
}

export function parseDurationSeconds(duration: string): number {
  if (!duration.endsWith("s")) {
    throw new RouteCalculationError("Routes API returned an invalid duration.");
  }

  const seconds = Number(duration.slice(0, -1));

  if (!Number.isFinite(seconds)) {
    throw new RouteCalculationError("Routes API returned an invalid duration.");
  }

  return Math.round(seconds);
}

export function decodeEncodedPolyline(encodedPolyline: string): Coordinates[] {
  const path: Coordinates[] = [];
  let index = 0;
  let latitude = 0;
  let longitude = 0;

  while (index < encodedPolyline.length) {
    const latitudeResult = decodeNextValue(encodedPolyline, index);
    latitude += latitudeResult.value;
    index = latitudeResult.nextIndex;

    const longitudeResult = decodeNextValue(encodedPolyline, index);
    longitude += longitudeResult.value;
    index = longitudeResult.nextIndex;

    path.push({
      lat: latitude / 100_000,
      lng: longitude / 100_000,
    });
  }

  return path;
}

export function decodeNextValue(
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
