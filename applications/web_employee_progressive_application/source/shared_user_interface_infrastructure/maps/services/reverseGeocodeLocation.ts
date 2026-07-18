import type { Coordinates } from "../types/location";

/**
 * Resolve a human-readable address for a dropped map pin using the Google
 * Geocoder. Returns a coordinate-based label if geocoding is unavailable so
 * pin-drop selection keeps working without a formatted address.
 */
export async function reverseGeocodeLocation(
  coordinates: Coordinates,
): Promise<string> {
  const coordinateLabel = `${coordinates.lat.toFixed(5)}, ${coordinates.lng.toFixed(5)}`;

  if (!window.google?.maps?.Geocoder) {
    return coordinateLabel;
  }

  try {
    const geocoder = new google.maps.Geocoder();
    const response = await geocoder.geocode({ location: coordinates });
    const firstResult = response.results[0];
    return firstResult?.formatted_address ?? coordinateLabel;
  } catch {
    return coordinateLabel;
  }
}
