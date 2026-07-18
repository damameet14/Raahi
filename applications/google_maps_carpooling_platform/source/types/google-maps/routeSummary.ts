import type { Coordinates } from "./location";

export type RouteTravelMode = "DRIVE" | "WALK" | "BICYCLE" | "TWO_WHEELER";

export type RouteStatus =
  | "idle"
  | "loading"
  | "ready"
  | "error"
  | "invalid";

export type RouteLabel =
  | "DEFAULT_ROUTE"
  | "DEFAULT_ROUTE_ALTERNATE"
  | "FUEL_EFFICIENT"
  | "SHORTER_DISTANCE";

export interface DrivingRouteCalculationRequest {
  apiKey: string;
  cacheKey?: string;
  destination: Coordinates;
  intermediateWaypoints?: Coordinates[];
  origin: Coordinates;
  shouldComputeAlternativeRoutes?: boolean;
  signal?: AbortSignal;
  travelMode?: RouteTravelMode;
}

export interface RouteSummary {
  cacheKey: string;
  distanceLabel: string;
  distanceMeters: number;
  durationLabel: string;
  durationSeconds: number;
  encodedPolyline: string;
  etaLabel: string;
  isDefaultRoute: boolean;
  path: Coordinates[];
  routeId: string;
  routeLabel: RouteLabel;
  routeTitle: string;
  travelMode: RouteTravelMode;
}

export interface RouteCalculationResult {
  cacheKey: string;
  routeStatus: RouteStatus;
  routes: RouteSummary[];
  selectedRouteId: string | null;
}

export interface RouteRefreshRequest {
  destination: Coordinates;
  origin: Coordinates;
  selectedRouteId: string | null;
  travelMode: RouteTravelMode;
}

export interface RouteCacheEntry {
  calculatedAtEpochMilliseconds: number;
  result: RouteCalculationResult;
}
