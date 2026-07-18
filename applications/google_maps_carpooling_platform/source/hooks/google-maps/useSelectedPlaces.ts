import { useCallback, useState } from "react";
import type { PlaceSearchRole, SelectedPlace } from "../../types/google-maps/places";

export type SelectedPlaces = Record<PlaceSearchRole, SelectedPlace | null>;

const INITIAL_SELECTED_PLACES: SelectedPlaces = {
  destination: null,
  pickup: null,
};

export function useSelectedPlaces() {
  const [selectedPlaces, setSelectedPlaces] = useState<SelectedPlaces>(
    INITIAL_SELECTED_PLACES,
  );

  const setSelectedPlace = useCallback(
    (role: PlaceSearchRole, place: SelectedPlace) => {
      setSelectedPlaces((current) => ({
        ...current,
        [role]: place,
      }));
    },
    [],
  );

  return {
    selectedPlaces,
    setSelectedPlace,
  };
}
