import type { Coordinates } from "../../types/google-maps/location";

export type BrowserGeolocationErrorCode =
  | "UNSUPPORTED"
  | "PERMISSION_DENIED"
  | "POSITION_UNAVAILABLE"
  | "TIMEOUT"
  | "UNKNOWN";

export class BrowserGeolocationError extends Error {
  constructor(
    public readonly code: BrowserGeolocationErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "BrowserGeolocationError";
  }
}

const GEOLOCATION_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  maximumAge: 30_000,
  timeout: 10_000,
};

export function getCurrentBrowserLocation(): Promise<Coordinates> {
  if (!navigator.geolocation) {
    return Promise.reject(
      new BrowserGeolocationError(
        "UNSUPPORTED",
        "Current location is not supported in this browser.",
      ),
    );
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        reject(
          new BrowserGeolocationError(
            toBrowserGeolocationErrorCode(error.code),
            getBrowserGeolocationErrorMessage(error.code),
          ),
        );
      },
      GEOLOCATION_OPTIONS,
    );
  });
}

function toBrowserGeolocationErrorCode(
  code: GeolocationPositionError["code"],
): BrowserGeolocationErrorCode {
  switch (code) {
    case GeolocationPositionError.PERMISSION_DENIED:
      return "PERMISSION_DENIED";
    case GeolocationPositionError.POSITION_UNAVAILABLE:
      return "POSITION_UNAVAILABLE";
    case GeolocationPositionError.TIMEOUT:
      return "TIMEOUT";
    default:
      return "UNKNOWN";
  }
}

function getBrowserGeolocationErrorMessage(
  code: GeolocationPositionError["code"],
): string {
  switch (code) {
    case GeolocationPositionError.PERMISSION_DENIED:
      return "Location permission was denied.";
    case GeolocationPositionError.POSITION_UNAVAILABLE:
      return "Current location is unavailable.";
    case GeolocationPositionError.TIMEOUT:
      return "Current location request timed out.";
    default:
      return "Unable to get current location.";
  }
}
