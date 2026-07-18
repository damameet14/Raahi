/**
 * Renders a driving route between two points with origin/destination markers,
 * a polyline, and a distance/ETA summary. Used for route confirmation and for
 * ride detail previews. Falls back to a straight connector if the Routes API
 * is unavailable.
 */

import { useEffect, useRef, useState } from "react";
import { GoogleMap, MarkerF, PolylineF } from "@react-google-maps/api";
import { Loader2 } from "lucide-react";

import { useGoogleMapsApiLoader } from "./GoogleMapsApiLoaderProvider";
import { computeDrivingRoute } from "./services/computeDrivingRoute";
import type { Coordinates } from "./types/location";
import type { RouteSummary } from "./types/routeSummary";

interface RoutePreviewMapProps {
  origin: Coordinates;
  destination: Coordinates;
  heightPixels?: number;
}

export function RoutePreviewMap({
  origin,
  destination,
  heightPixels = 220,
}: RoutePreviewMapProps) {
  const { isLoaded, hasApiKey, apiKey } = useGoogleMapsApiLoader();
  const [routeSummary, setRouteSummary] = useState<RouteSummary | null>(null);
  const [routeErrorMessage, setRouteErrorMessage] = useState<string | null>(null);
  const mapReference = useRef<google.maps.Map | null>(null);

  useEffect(() => {
    if (!hasApiKey) {
      return;
    }
    const abortController = new AbortController();
    setRouteErrorMessage(null);
    computeDrivingRoute({
      apiKey,
      origin,
      destination,
      signal: abortController.signal,
    })
      .then((summary) => setRouteSummary(summary))
      .catch((error: unknown) => {
        if (!abortController.signal.aborted) {
          setRouteSummary(null);
          setRouteErrorMessage(
            error instanceof Error ? error.message : "Could not load route",
          );
        }
      });
    return () => abortController.abort();
  }, [apiKey, hasApiKey, origin, destination]);

  useEffect(() => {
    const map = mapReference.current;
    if (!map || !isLoaded) {
      return;
    }
    const bounds = new google.maps.LatLngBounds();
    bounds.extend(origin);
    bounds.extend(destination);
    map.fitBounds(bounds, 48);
  }, [isLoaded, origin, destination, routeSummary]);

  if (!hasApiKey) {
    return (
      <div
        className="flex items-center justify-center rounded-xl bg-surface-secondary text-xs text-text-muted"
        style={{ height: heightPixels }}
      >
        Enable Google Maps to preview the route.
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div
        className="flex items-center justify-center rounded-xl bg-surface-secondary"
        style={{ height: heightPixels }}
      >
        <Loader2 className="animate-spin text-text-muted" />
      </div>
    );
  }

  const polylinePath = routeSummary?.path ?? [origin, destination];

  return (
    <div>
      <GoogleMap
        mapContainerStyle={{
          width: "100%",
          height: `${heightPixels}px`,
          borderRadius: "12px",
        }}
        onLoad={(map) => {
          mapReference.current = map;
        }}
        options={{ disableDefaultUI: true, clickableIcons: false }}
      >
        <MarkerF position={origin} label="A" />
        <MarkerF position={destination} label="B" />
        <PolylineF
          path={polylinePath}
          options={{ strokeColor: "#249448", strokeWeight: 4 }}
        />
      </GoogleMap>
      {routeSummary && (
        <div className="mt-2 flex items-center justify-between rounded-xl bg-surface-secondary px-3 py-2 text-sm">
          <span className="font-semibold">{routeSummary.distanceLabel}</span>
          <span className="text-text-secondary">
            Approx. {routeSummary.etaLabel}
          </span>
        </div>
      )}
      {routeErrorMessage && !routeSummary && (
        <p className="mt-2 text-xs text-text-muted">
          Showing a direct line — {routeErrorMessage}
        </p>
      )}
    </div>
  );
}
