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
      "Google Maps API key is missing. Copy applications/google_maps_carpooling_platform/.env.example to an untracked .env file, set GOOGLE_MAPS_API_KEY, and restart Vite. The app exposes it as VITE_GOOGLE_MAPS_API_KEY at build time.",
    );
  }

  return apiKey;
}
