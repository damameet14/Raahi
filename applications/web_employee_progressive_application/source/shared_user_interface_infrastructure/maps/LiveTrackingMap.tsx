/**
 * Live tracking map for an active trip. Shows the pickup and drop markers plus
 * the driver's most recent location, recentering on the driver as it updates
 * (the parent polls the backend every ~5 seconds and passes new coordinates).
 */

import { useEffect, useRef } from "react";
import { GoogleMap, MarkerF } from "@react-google-maps/api";
import { Loader2 } from "lucide-react";

import { useGoogleMapsApiLoader } from "./GoogleMapsApiLoaderProvider";
import type { Coordinates } from "./types/location";

interface LiveTrackingMapProps {
  driverLocation: Coordinates | null;
  pickup: Coordinates;
  drop: Coordinates;
  heightPixels?: number;
}

export function LiveTrackingMap({
  driverLocation,
  pickup,
  drop,
  heightPixels = 300,
}: LiveTrackingMapProps) {
  const { isLoaded, hasApiKey } = useGoogleMapsApiLoader();
  const mapReference = useRef<google.maps.Map | null>(null);

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

  return (
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
  );
}
