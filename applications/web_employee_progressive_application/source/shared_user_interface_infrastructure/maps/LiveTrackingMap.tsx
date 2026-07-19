/**
 * Live tracking map for an active trip. Shows the pickup and drop markers, the
 * driving route to the destination, and the driver's most recent location,
 * recentering on the driver as it updates (the parent polls the backend every
 * ~5 seconds and passes new coordinates).
 *
 * The route line and ETA are computed from the driver's current position (or
 * the pickup before the driver appears) to the destination, and are refreshed
 * only when the driver has moved a meaningful distance so tracking does not
 * issue a Routes API call on every 5-second poll.
 */

import { useEffect, useRef, useState } from "react";
import { GoogleMap, MarkerF, PolylineF } from "@react-google-maps/api";
import { Loader2 } from "lucide-react";

import { useGoogleMapsApiLoader } from "./GoogleMapsApiLoaderProvider";
import { computeDrivingRoute } from "./services/computeDrivingRoute";
import type { Coordinates } from "./types/location";
import type { RouteSummary } from "./types/routeSummary";

interface LiveTrackingMapProps {
  driverLocation: Coordinates | null;
  pickup: Coordinates;
  drop: Coordinates;
  heightPixels?: number;
}

// Minimum driver movement (in metres) before the route/ETA are recomputed.
const ROUTE_REFRESH_DISTANCE_METERS = 150;

export function LiveTrackingMap({
  driverLocation,
  pickup,
  drop,
  heightPixels = 300,
}: LiveTrackingMapProps) {
  const { isLoaded, hasApiKey, apiKey } = useGoogleMapsApiLoader();
  const mapReference = useRef<google.maps.Map | null>(null);
  const [routeSummary, setRouteSummary] = useState<RouteSummary | null>(null);
  const lastRoutedOriginRef = useRef<Coordinates | null>(null);

  // The route originates from the driver once their location is known,
  // otherwise from the pickup point.
  const routeOrigin = driverLocation ?? pickup;

  useEffect(() => {
    if (!hasApiKey) {
      return;
    }
    // Skip recomputation when the origin has barely moved.
    const previousOrigin = lastRoutedOriginRef.current;
    if (
      previousOrigin &&
      routeSummary &&
      distanceInMeters(previousOrigin, routeOrigin) < ROUTE_REFRESH_DISTANCE_METERS
    ) {
      return;
    }
    lastRoutedOriginRef.current = routeOrigin;

    const abortController = new AbortController();
    computeDrivingRoute({
      apiKey,
      origin: routeOrigin,
      destination: drop,
      signal: abortController.signal,
    })
      .then((summary) => setRouteSummary(summary))
      .catch(() => {
        if (!abortController.signal.aborted) {
          // Keep the last good route rather than clearing the line on a
          // transient failure.
        }
      });
    return () => abortController.abort();
  }, [apiKey, hasApiKey, routeOrigin.lat, routeOrigin.lng, drop.lat, drop.lng]);

  useEffect(() => {
    const map = mapReference.current;
    if (!map || !isLoaded) {
      return;
    }
    if (driverLocation) {
      map.panTo(driverLocation);
      return;
    }
    const bounds = new google.maps.LatLngBounds();
    bounds.extend(pickup);
    bounds.extend(drop);
    map.fitBounds(bounds, 48);
  }, [isLoaded, driverLocation, pickup, drop]);

  if (!hasApiKey || !isLoaded) {
    return (
      <div
        className="flex items-center justify-center rounded-xl bg-surface-secondary"
        style={{ height: heightPixels }}
      >
        {hasApiKey ? (
          <Loader2 className="animate-spin text-text-muted" />
        ) : (
          <span className="text-xs text-text-muted">
            Enable Google Maps to see live tracking.
          </span>
        )}
      </div>
    );
  }

  const routePath = routeSummary?.path ?? [routeOrigin, drop];

  return (
    <div>
      <GoogleMap
        mapContainerStyle={{
          width: "100%",
          height: `${heightPixels}px`,
          borderRadius: "12px",
        }}
        center={driverLocation ?? pickup}
        zoom={14}
        onLoad={(map) => {
          mapReference.current = map;
        }}
        options={{ disableDefaultUI: true, clickableIcons: false }}
      >
        <PolylineF
          path={routePath}
          options={{ strokeColor: "#249448", strokeWeight: 4 }}
        />
        <MarkerF position={pickup} label="P" />
        <MarkerF position={drop} label="D" />
        {driverLocation && (
          <MarkerF
            position={driverLocation}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: "#249448",
              fillOpacity: 1,
              strokeColor: "#ffffff",
              strokeWeight: 3,
            }}
          />
        )}
      </GoogleMap>
      {routeSummary && (
        <div className="mt-2 flex items-center justify-between rounded-xl bg-surface-secondary px-3 py-2 text-sm">
          <span className="font-semibold">{routeSummary.distanceLabel} to destination</span>
          <span className="text-text-secondary">ETA {routeSummary.etaLabel}</span>
        </div>
      )}
    </div>
  );
}

/** Approximate great-circle distance between two coordinates, in metres. */
function distanceInMeters(from: Coordinates, to: Coordinates): number {
  const earthRadiusMeters = 6_371_000;
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const deltaLat = toRadians(to.lat - from.lat);
  const deltaLng = toRadians(to.lng - from.lng);
  const halfChordSquared =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(toRadians(from.lat)) *
      Math.cos(toRadians(to.lat)) *
      Math.sin(deltaLng / 2) ** 2;
  return (
    2 *
    earthRadiusMeters *
    Math.atan2(Math.sqrt(halfChordSquared), Math.sqrt(1 - halfChordSquared))
  );
}
