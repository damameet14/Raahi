export class GoogleMapsConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GoogleMapsConfigurationError";
  }
}

/**
 * Read the browser Google Maps API key from the Vite environment.
 * Returns an empty string when unset so callers can degrade gracefully
 * (for example, allow manual pin-drop without live autocomplete).
 */
export function readGoogleMapsApiKey(): string {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.trim();
  if (!apiKey || apiKey === "YOUR_API_KEY") {
    return "";
  }
  return apiKey;
}

/** Default map center for the demo deployment (Noida, Delhi NCR). */
export const DEFAULT_MAP_CENTER = { lat: 28.6139, lng: 77.209 };

/**
 * Region bias used for place autocomplete suggestions. The radius must stay
 * within the Places API (New) limit of 50 km for a `locationBias` circle —
 * a larger value makes `AutocompleteSuggestion.fetchAutocompleteSuggestions`
 * fail with HTTP 400 (INVALID_ARGUMENT), which is why suggestions returned
 * nothing. 40 km keeps a wide bias while staying safely under the cap.
 */
export const PLACES_LOCATION_BIAS_CENTER = { lat: 28.6139, lng: 77.209 };
export const PLACES_LOCATION_BIAS_RADIUS_METERS = 40_000;
