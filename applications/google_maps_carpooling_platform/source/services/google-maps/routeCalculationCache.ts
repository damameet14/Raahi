import type {
  DrivingRouteCalculationRequest,
  RouteCacheEntry,
  RouteCalculationResult,
} from "../../types/google-maps/routeSummary";

const ROUTE_CACHE_TTL_MILLISECONDS = 2 * 60 * 1000;
const routeCalculationCache = new Map<string, RouteCacheEntry>();

export function createRouteCalculationCacheKey({
  destination,
  intermediateWaypoints = [],
  origin,
  shouldComputeAlternativeRoutes = false,
  travelMode = "DRIVE",
}: DrivingRouteCalculationRequest): string {
  const waypointKey = intermediateWaypoints
    .map((waypoint) => `${waypoint.lat.toFixed(5)},${waypoint.lng.toFixed(5)}`)
    .join("|");

  return [
    travelMode,
    shouldComputeAlternativeRoutes ? "alternatives" : "default",
    `${origin.lat.toFixed(5)},${origin.lng.toFixed(5)}`,
    waypointKey,
    `${destination.lat.toFixed(5)},${destination.lng.toFixed(5)}`,
  ].join("::");
}

export function getCachedRouteCalculationResult(
  cacheKey: string,
): RouteCalculationResult | null {
  const cachedEntry = routeCalculationCache.get(cacheKey);

  if (!cachedEntry) {
    return null;
  }

  const isCacheEntryFresh =
    Date.now() - cachedEntry.calculatedAtEpochMilliseconds <
    ROUTE_CACHE_TTL_MILLISECONDS;

  if (!isCacheEntryFresh) {
    routeCalculationCache.delete(cacheKey);
    return null;
  }

  return cachedEntry.result;
}

export function setCachedRouteCalculationResult(
  result: RouteCalculationResult,
): void {
  routeCalculationCache.set(result.cacheKey, {
    calculatedAtEpochMilliseconds: Date.now(),
    result,
  });
}

export function deleteCachedRouteCalculationResult(cacheKey: string): void {
  routeCalculationCache.delete(cacheKey);
}

