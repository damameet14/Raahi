/**
 * Loads the Google Maps JavaScript API once for the whole application and
 * exposes its readiness through context. Screens read `isLoaded` before
 * rendering maps, and `hasApiKey` to decide whether live features (route
 * preview, autocomplete) are available or manual pin-drop must be used.
 */

import { createContext, useContext, type ReactNode } from "react";
import { useJsApiLoader, type Libraries } from "@react-google-maps/api";

import { readGoogleMapsApiKey } from "./services/googleMapsConfiguration";

// Must be a stable reference so the loader does not reinitialize on re-render.
const REQUIRED_MAPS_LIBRARIES: Libraries = ["places", "geocoding", "maps"];

interface GoogleMapsApiLoaderContextValue {
  isLoaded: boolean;
  loadError: Error | undefined;
  hasApiKey: boolean;
  apiKey: string;
}

const GoogleMapsApiLoaderContext =
  createContext<GoogleMapsApiLoaderContextValue | null>(null);

export function GoogleMapsApiLoaderProvider({ children }: { children: ReactNode }) {
  const apiKey = readGoogleMapsApiKey();
  const { isLoaded, loadError } = useJsApiLoader({
    id: "raahi-employee-google-maps",
    googleMapsApiKey: apiKey,
    libraries: REQUIRED_MAPS_LIBRARIES,
  });

  return (
    <GoogleMapsApiLoaderContext.Provider
      value={{
        isLoaded: isLoaded && Boolean(apiKey),
        loadError,
        hasApiKey: Boolean(apiKey),
        apiKey,
      }}
    >
      {children}
    </GoogleMapsApiLoaderContext.Provider>
  );
}

export function useGoogleMapsApiLoader(): GoogleMapsApiLoaderContextValue {
  const context = useContext(GoogleMapsApiLoaderContext);
  if (!context) {
    throw new Error(
      "useGoogleMapsApiLoader must be used within a GoogleMapsApiLoaderProvider",
    );
  }
  return context;
}
