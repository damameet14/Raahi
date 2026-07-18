import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  InvalidRouteInputError,
  computeRouteCalculationResult,
} from "../../services/google-maps/computeDrivingRoute";
import {
  createRouteCalculationCacheKey,
  deleteCachedRouteCalculationResult,
  getCachedRouteCalculationResult,
  setCachedRouteCalculationResult,
} from "../../services/google-maps/routeCalculationCache";
import type { SelectedPlace } from "../../types/google-maps/places";
import type {
  RouteCalculationResult,
  RouteSummary,
  RouteTravelMode,
} from "../../types/google-maps/routeSummary";

const ROUTE_REQUEST_TIMEOUT_MILLISECONDS = 12_000;

interface UseRouteCalculationOptions {
  apiKey: string;
  destination: SelectedPlace | null;
  pickup: SelectedPlace | null;
}

export function useRouteCalculation({
  apiKey,
  destination,
  pickup,
}: UseRouteCalculationOptions) {
  const [routeCalculationResult, setRouteCalculationResult] =
    useState<RouteCalculationResult | null>(null);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [travelMode, setTravelMode] = useState<RouteTravelMode>("DRIVE");
  const [refreshToken, setRefreshToken] = useState(0);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);
  const requestIdReference = useRef(0);

  const routeCacheKey = useMemo(() => {
    if (!pickup || !destination) {
      return null;
    }

    return createRouteCalculationCacheKey({
      apiKey,
      destination,
      origin: pickup,
      shouldComputeAlternativeRoutes: true,
      travelMode,
    });
  }, [apiKey, destination, pickup, travelMode]);

  useEffect(() => {
    if (!pickup || !destination || !routeCacheKey) {
      setRouteCalculationResult(null);
      setSelectedRouteId(null);
      setRouteError(null);
      setIsCalculatingRoute(false);
      return;
    }

    if (pickup.placeId === destination.placeId) {
      setRouteCalculationResult(null);
      setSelectedRouteId(null);
      setRouteError("Pickup and destination must be different places.");
      setIsCalculatingRoute(false);
      return;
    }

    const cachedResult =
      refreshToken === 0 ? getCachedRouteCalculationResult(routeCacheKey) : null;

    if (cachedResult) {
      setRouteCalculationResult(cachedResult);
      setSelectedRouteId(cachedResult.selectedRouteId);
      setRouteError(null);
      setIsCalculatingRoute(false);
      return;
    }

    const routeOrigin = pickup;
    const routeDestination = destination;
    const activeRouteCacheKey = routeCacheKey;
    const requestId = requestIdReference.current + 1;
    const abortController = new AbortController();
    let didRouteRequestTimeOut = false;
    const routeRequestTimeoutIdentifier = window.setTimeout(() => {
      didRouteRequestTimeOut = true;
      abortController.abort();
    }, ROUTE_REQUEST_TIMEOUT_MILLISECONDS);
    requestIdReference.current = requestId;
    setIsCalculatingRoute(true);
    setRouteError(null);

    async function calculateRoute() {
      try {
        const nextResult = await computeRouteCalculationResult({
          apiKey,
          cacheKey: activeRouteCacheKey,
          destination: routeDestination,
          origin: routeOrigin,
          shouldComputeAlternativeRoutes: true,
          signal: abortController.signal,
          travelMode,
        });

        if (requestIdReference.current === requestId) {
          setCachedRouteCalculationResult(nextResult);
          setRouteCalculationResult(nextResult);
          setSelectedRouteId(nextResult.selectedRouteId);
        }
      } catch (error) {
        if (
          abortController.signal.aborted ||
          requestIdReference.current !== requestId
        ) {
          return;
        }

        setRouteCalculationResult(null);
        setSelectedRouteId(null);
        setRouteError(
          didRouteRequestTimeOut
            ? "Route request timed out. Please retry."
            : getRouteCalculationErrorMessage(error),
        );
      } finally {
        window.clearTimeout(routeRequestTimeoutIdentifier);

        if (requestIdReference.current === requestId) {
          setIsCalculatingRoute(false);
        }
      }
    }

    void calculateRoute();

    return () => {
      window.clearTimeout(routeRequestTimeoutIdentifier);
      abortController.abort();
    };
  }, [apiKey, destination, pickup, refreshToken, routeCacheKey, travelMode]);

  const routes = routeCalculationResult?.routes ?? [];
  const selectedRoute =
    routes.find((route) => route.routeId === selectedRouteId) ??
    routes[0] ??
    null;

  const refreshRoute = useCallback(() => {
    if (routeCacheKey) {
      deleteCachedRouteCalculationResult(routeCacheKey);
    }

    setRefreshToken((currentRefreshToken) => currentRefreshToken + 1);
  }, [routeCacheKey]);

  return {
    isCalculatingRoute,
    refreshRoute,
    route: selectedRoute,
    routeCalculationResult,
    routeError,
    routes,
    selectedRouteId,
    setSelectedRouteId,
    setTravelMode,
    travelMode,
  };
}

function getRouteCalculationErrorMessage(error: unknown): string {
  if (error instanceof InvalidRouteInputError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unable to calculate this route.";
}
