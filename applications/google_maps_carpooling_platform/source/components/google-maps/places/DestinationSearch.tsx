import { PlaceAutocomplete } from "./PlaceAutocomplete";
import type { Coordinates } from "../../../types/google-maps/location";
import type { SelectedPlace } from "../../../types/google-maps/places";

interface DestinationSearchProps {
  origin: Coordinates;
  selectedPlace: SelectedPlace | null;
  onPlaceSelected: (place: SelectedPlace) => void;
}

export function DestinationSearch({
  origin,
  selectedPlace,
  onPlaceSelected,
}: DestinationSearchProps) {
  return (
    <PlaceAutocomplete
      label="Destination"
      onPlaceSelected={onPlaceSelected}
      origin={origin}
      placeholder="Search destination"
      role="destination"
      selectedPlace={selectedPlace}
    />
  );
}
