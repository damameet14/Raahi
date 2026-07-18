import { useCallback, useEffect, useRef, useState } from "react";
import {
  createAutocompleteSessionToken,
  fetchPlacePredictions,
  fetchSelectedPlace,
} from "../../services/google-maps/placesAutocompleteService";
import type { Coordinates } from "../../types/google-maps/location";
import type { PlacePrediction, SelectedPlace } from "../../types/google-maps/places";
import { useDebouncedValue } from "./useDebouncedValue";

const MIN_SEARCH_LENGTH = 2;
const SEARCH_DEBOUNCE_MS = 300;

interface UsePlaceAutocompleteOptions {
  origin: Coordinates;
  onPlaceSelected: (place: SelectedPlace) => void;
}

export function usePlaceAutocomplete({
  origin,
  onPlaceSelected,
}: UsePlaceAutocompleteOptions) {
  const [inputValue, setInputValue] = useState("");
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [isSearching, setIsSearching] = useState(false);
  const [isResolvingPlace, setIsResolvingPlace] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const debouncedInputValue = useDebouncedValue(
    inputValue.trim(),
    SEARCH_DEBOUNCE_MS,
  );
  const sessionTokenReference =
    useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  const requestIdReference = useRef(0);
  const selectedInputValueReference = useRef("");
  const isSelectionSettledReference = useRef(false);

  const resetSessionToken = useCallback(async () => {
    sessionTokenReference.current = await createAutocompleteSessionToken();
  }, []);

  useEffect(() => {
    void resetSessionToken().catch(() => {
      setError("Places search is not ready yet.");
    });
  }, [resetSessionToken]);

  useEffect(() => {
    if (debouncedInputValue.length < MIN_SEARCH_LENGTH) {
      setPredictions([]);
      setHighlightedIndex(-1);
      setIsSearching(false);
      setIsOpen(false);
      return;
    }

    if (
      isSelectionSettledReference.current ||
      debouncedInputValue === selectedInputValueReference.current
    ) {
      setPredictions([]);
      setHighlightedIndex(-1);
      setIsSearching(false);
      setIsOpen(false);
      return;
    }

    const requestId = requestIdReference.current + 1;
    requestIdReference.current = requestId;
    setIsSearching(true);
    setError(null);

    async function searchPlaces() {
      try {
        if (!sessionTokenReference.current) {
          sessionTokenReference.current = await createAutocompleteSessionToken();
        }

        const nextPredictions = await fetchPlacePredictions(
          debouncedInputValue,
          sessionTokenReference.current,
          origin,
        );

        if (
          requestIdReference.current !== requestId ||
          isSelectionSettledReference.current
        ) {
          return;
        }

        setPredictions(nextPredictions);
        setHighlightedIndex(nextPredictions.length > 0 ? 0 : -1);
        setIsOpen(true);
      } catch {
        if (requestIdReference.current !== requestId) {
          return;
        }

        setPredictions([]);
        setHighlightedIndex(-1);
        setIsOpen(true);
        setError("Unable to load place suggestions. Check Places API access.");
      } finally {
        if (requestIdReference.current === requestId) {
          setIsSearching(false);
        }
      }
    }

    void searchPlaces();
  }, [debouncedInputValue, origin]);

  const selectPrediction = useCallback(
    async (prediction: PlacePrediction) => {
      requestIdReference.current += 1;
      setIsResolvingPlace(true);
      setIsSearching(false);
      setError(null);

      try {
        const selectedPlace = await fetchSelectedPlace(prediction.prediction);
        onPlaceSelected(selectedPlace);
        selectedInputValueReference.current = selectedPlace.formattedAddress;
        isSelectionSettledReference.current = true;
        setInputValue(selectedPlace.formattedAddress);
        setPredictions([]);
        setHighlightedIndex(-1);
        setIsOpen(false);
        await resetSessionToken();
      } catch {
        setError("Unable to load details for the selected place.");
        setIsOpen(true);
      } finally {
        setIsResolvingPlace(false);
      }
    },
    [onPlaceSelected, resetSessionToken],
  );

  const updateInputValue = useCallback((nextValue: string) => {
    if (nextValue !== selectedInputValueReference.current) {
      isSelectionSettledReference.current = false;
    }

    setInputValue(nextValue);
  }, []);

  const moveHighlight = useCallback(
    (direction: 1 | -1) => {
      if (predictions.length === 0) {
        return;
      }

      setHighlightedIndex((currentIndex) => {
        const nextIndex =
          (currentIndex + direction + predictions.length) % predictions.length;
        return nextIndex;
      });
    },
    [predictions.length],
  );

  const closeSuggestions = useCallback(() => {
    setIsOpen(false);
    setHighlightedIndex(-1);
  }, []);

  return {
    closeSuggestions,
    error,
    highlightedIndex,
    inputValue,
    isOpen,
    isResolvingPlace,
    isSearching,
    moveHighlight,
    predictions,
    selectPrediction,
    setHighlightedIndex,
    setInputValue: updateInputValue,
  };
}
