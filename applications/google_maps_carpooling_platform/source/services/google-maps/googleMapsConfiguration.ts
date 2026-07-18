export class GoogleMapsConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GoogleMapsConfigError";
  }
}

export function getGoogleMapsApiKey(): string {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.trim();

  if (!apiKey || apiKey === "YOUR_API_KEY") {
    throw new GoogleMapsConfigError(
      "Google Maps API key is missing. Add GOOGLE_MAPS_API_KEY to .env.",
    );
  }

  return apiKey;
}
