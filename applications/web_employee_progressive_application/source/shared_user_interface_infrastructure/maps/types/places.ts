import type { Coordinates } from "./location";

export type PlaceSearchRole = "pickup" | "destination";

export interface PlacePrediction {
  placeId: string;
  mainText: string;
  secondaryText: string;
  text: string;
  distanceMeters: number | null;
  prediction: google.maps.places.PlacePrediction;
}

export interface SelectedPlace extends Coordinates {
  placeId: string;
  formattedAddress: string;
}
