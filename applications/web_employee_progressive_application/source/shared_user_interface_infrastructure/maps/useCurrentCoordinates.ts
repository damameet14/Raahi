/**
 * Requests the browser's current GPS position once and shares the result
 * across every caller, so mounting several LocationSelectorFields together
 * (pickup + destination on the same screen) triggers a single permission
 * prompt instead of one per field.
 */

import { useEffect, useState } from "react";

import type { Coordinates } from "./types/location";

const GEOLOCATION_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 8000,
  maximumAge: 300_000,
};

let cachedCoordinatesPromise: Promise<Coordinates | null> | null = null;

function requestCurrentCoordinates(): Promise<Coordinates | null> {
  if (!cachedCoordinatesPromise) {
    cachedCoordinatesPromise = new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) =>
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          }),
        () => resolve(null),
        GEOLOCATION_OPTIONS,
      );
    });
  }
  return cachedCoordinatesPromise;
}

/**
 * The user's current GPS position once resolved, or null while pending or
 * when location is unavailable/denied — callers should fall back to a
 * fixed default center in that case.
 */
export function useCurrentCoordinates(): Coordinates | null {
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);

  useEffect(() => {
    let isCancelled = false;
    requestCurrentCoordinates().then((resolvedCoordinates) => {
      if (!isCancelled && resolvedCoordinates) {
        setCoordinates(resolvedCoordinates);
      }
    });
    return () => {
      isCancelled = true;
    };
  }, []);

  return coordinates;
}
