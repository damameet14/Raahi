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
  const sessionTokenRef =
    useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  const requestIdRef = useRef(0);
  const selectedInputValueRef = useRef("");
  const isSelectionSettledRef = useRef(false);

  const resetSessionToken = useCallback(async () => {
    sessionTokenRef.current = await createAutocompleteSessionToken();
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
      isSelectionSettledRef.current ||
      debouncedInputValue === selectedInputValueRef.current
    ) {
      setPredictions([]);
      setHighlightedIndex(-1);
      setIsSearching(false);
      setIsOpen(false);
      return;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setIsSearching(true);
    setError(null);

    async function searchPlaces() {
      try {
        if (!sessionTokenRef.current) {
          sessionTokenRef.current = await createAutocompleteSessionToken();
        }

        const nextPredictions = await fetchPlacePredictions(
          debouncedInputValue,
          sessionTokenRef.current,
          origin,
        );

        if (
          requestIdRef.current !== requestId ||
          isSelectionSettledRef.current
        ) {
          return;
        }

        setPredictions(nextPredictions);
        setHighlightedIndex(nextPredictions.length > 0 ? 0 : -1);
        setIsOpen(true);
      } catch {
        if (requestIdRef.current !== requestId) {
          return;
        }

        setPredictions([]);
        setHighlightedIndex(-1);
        setIsOpen(true);
        setError("Unable to load place suggestions. Check Places API access.");
      } finally {
        if (requestIdRef.current === requestId) {
          setIsSearching(false);
        }
      }
    }

    void searchPlaces();
  }, [debouncedInputValue, origin]);

  const selectPrediction = useCallback(
    async (prediction: PlacePrediction) => {
      requestIdRef.current += 1;
      setIsResolvingPlace(true);
      setIsSearching(false);
      setError(null);

      try {
        const selectedPlace = await fetchSelectedPlace(prediction.prediction);
        onPlaceSelected(selectedPlace);
        selectedInputValueRef.current = selectedPlace.formattedAddress;
        isSelectionSettledRef.current = true;
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
    if (nextValue !== selectedInputValueRef.current) {
      isSelectionSettledRef.current = false;
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
