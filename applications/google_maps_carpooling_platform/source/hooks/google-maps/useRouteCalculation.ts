import { useEffect, useRef, useState } from "react";
import {
  InvalidRouteInputError,
  computeDrivingRoute,
} from "../../services/google-maps/computeDrivingRoute";
import type { RouteSummary } from "../../types/google-maps/routeSummary";
import type { SelectedPlace } from "../../types/google-maps/places";

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
  const [route, setRoute] = useState<RouteSummary | null>(null);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (!pickup || !destination) {
      setRoute(null);
      setRouteError(null);
      setIsCalculatingRoute(false);
      return;
    }

    if (pickup.placeId === destination.placeId) {
      setRoute(null);
      setRouteError("Pickup and destination must be different places.");
      setIsCalculatingRoute(false);
      return;
    }

    const routeOrigin = pickup;
    const routeDestination = destination;
    const requestId = requestIdRef.current + 1;
    const abortController = new AbortController();
    requestIdRef.current = requestId;
    setIsCalculatingRoute(true);
    setRouteError(null);

    async function calculateRoute() {
      try {
        const nextRoute = await computeDrivingRoute({
          apiKey,
          destination: routeDestination,
          origin: routeOrigin,
          signal: abortController.signal,
        });

        if (requestIdRef.current === requestId) {
          setRoute(nextRoute);
        }
      } catch (error) {
        if (abortController.signal.aborted || requestIdRef.current !== requestId) {
          return;
        }

        setRoute(null);
        setRouteError(getRouteCalculationErrorMessage(error));
      } finally {
        if (requestIdRef.current === requestId) {
          setIsCalculatingRoute(false);
        }
      }
    }

    void calculateRoute();

    return () => {
      abortController.abort();
    };
  }, [apiKey, destination, pickup]);

  return {
    isCalculatingRoute,
    route,
    routeError,
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
