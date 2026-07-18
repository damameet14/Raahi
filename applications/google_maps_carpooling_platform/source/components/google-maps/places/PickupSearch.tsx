import { PlaceAutocomplete } from "./PlaceAutocomplete";
import type { Coordinates } from "../../../types/google-maps/location";
import type { SelectedPlace } from "../../../types/google-maps/places";

interface PickupSearchProps {
  origin: Coordinates;
  selectedPlace: SelectedPlace | null;
  onPlaceSelected: (place: SelectedPlace) => void;
}

export function PickupSearch({
  origin,
  selectedPlace,
  onPlaceSelected,
}: PickupSearchProps) {
  return (
    <PlaceAutocomplete
      label="Pickup"
      onPlaceSelected={onPlaceSelected}
      origin={origin}
      placeholder="Search pickup location"
      role="pickup"
      selectedPlace={selectedPlace}
    />
  );
}
