/**
 * A location input offering both Google Places autocomplete and a draggable
 * map pin. Typing shows address suggestions; tapping or dragging the map pin
 * selects a point and reverse-geocodes its address. Emits a SelectedLocation.
 */

import { useEffect, useRef, useState } from "react";
import { GoogleMap, MarkerF } from "@react-google-maps/api";
import { MapPin, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

import { useGoogleMapsApiLoader } from "./GoogleMapsApiLoaderProvider";
import { useCurrentCoordinates } from "./useCurrentCoordinates";
import { DEFAULT_MAP_CENTER } from "./services/googleMapsConfiguration";
import {
  createAutocompleteSessionToken,
  fetchPlacePredictions,
  fetchSelectedPlace,
} from "./services/placesAutocompleteService";
import { reverseGeocodeLocation } from "./services/reverseGeocodeLocation";
import type { PlacePrediction } from "./types/places";
import type { SelectedLocation } from "./types/selectedLocation";

const MAP_CONTAINER_STYLE = { width: "100%", height: "180px", borderRadius: "12px" };

interface LocationSelectorFieldProps {
  label: string;
  value: SelectedLocation | null;
  onChange: (location: SelectedLocation) => void;
  placeholder?: string;
}

export function LocationSelectorField({
  label,
  value,
  onChange,
  placeholder,
}: LocationSelectorFieldProps) {
  const { isLoaded, hasApiKey } = useGoogleMapsApiLoader();
  const currentCoordinates = useCurrentCoordinates();
  const [inputText, setInputText] = useState(value?.label ?? "");
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(
    null,
  );
  const suppressNextSearchRef = useRef(false);

  useEffect(() => {
    setInputText(value?.label ?? "");
  }, [value?.label]);

  useEffect(() => {
    if (!isLoaded || suppressNextSearchRef.current) {
      suppressNextSearchRef.current = false;
      return;
    }
    const trimmed = inputText.trim();
    if (trimmed.length < 2) {
      setPredictions([]);
      return;
    }
    let isCancelled = false;
    setIsSearching(true);
    const timeoutId = window.setTimeout(async () => {
      try {
        if (!sessionTokenRef.current) {
          sessionTokenRef.current = await createAutocompleteSessionToken();
        }
        const results = await fetchPlacePredictions(
          trimmed,
          sessionTokenRef.current,
          currentCoordinates ?? undefined,
        );
        if (!isCancelled) {
          setPredictions(results);
        }
      } catch {
        if (!isCancelled) {
          setPredictions([]);
          toast.error("Couldn't fetch address suggestions. Try again.");
        }
      } finally {
        if (!isCancelled) {
          setIsSearching(false);
        }
      }
    }, 320);
    return () => {
      isCancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [inputText, isLoaded, currentCoordinates]);

  async function handlePredictionSelected(prediction: PlacePrediction) {
    try {
      const place = await fetchSelectedPlace(prediction.prediction);
      suppressNextSearchRef.current = true;
      sessionTokenRef.current = null;
      setPredictions([]);
      setInputText(place.formattedAddress);
      onChange({
        latitude: place.lat,
        longitude: place.lng,
        label: place.formattedAddress,
      });
    } catch {
      setPredictions([]);
      toast.error("Couldn't select that place. Please try again.");
    }
  }

  async function handleMapPointChosen(mapEvent: google.maps.MapMouseEvent) {
    const latLng = mapEvent.latLng;
    if (!latLng) {
      return;
    }
    const latitude = latLng.lat();
    const longitude = latLng.lng();
    const resolvedLabel = await reverseGeocodeLocation({
      lat: latitude,
      lng: longitude,
    });
    suppressNextSearchRef.current = true;
    setInputText(resolvedLabel);
    setPredictions([]);
    onChange({ latitude, longitude, label: resolvedLabel });
  }

  const mapCenter = value
    ? { lat: value.latitude, lng: value.longitude }
    : (currentCoordinates ?? DEFAULT_MAP_CENTER);

  return (
    <div className="relative">
      <label className="mb-1 block text-xs font-semibold text-[color:var(--color-text-secondary)]">
        {label}
      </label>
      <div className="relative">
        <MapPin
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-raahi-600"
        />
        <input
          type="text"
          value={inputText}
          placeholder={placeholder ?? "Search address"}
          onChange={(event) => setInputText(event.target.value)}
          className="w-full rounded-xl border border-[color:var(--color-border-primary)] bg-white py-3 pl-9 pr-10 text-sm outline-none focus:border-raahi-500"
        />
        <button
          type="button"
          onClick={() => setShowMap((current) => !current)}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs font-semibold text-raahi-700"
        >
          {showMap ? "Hide map" : "Pin"}
        </button>
        {isSearching && (
          <Loader2
            size={14}
            className="absolute right-14 top-1/2 -translate-y-1/2 animate-spin text-text-muted"
          />
        )}
      </div>

      {predictions.length > 0 && (
        <ul className="absolute z-30 mt-1 w-full overflow-hidden rounded-xl border border-[color:var(--color-border-primary)] bg-white shadow-lg">
          {predictions.map((prediction) => (
            <li key={prediction.placeId}>
              <button
                type="button"
                onClick={() => handlePredictionSelected(prediction)}
                className="flex w-full flex-col items-start border-b border-[color:var(--color-border-primary)] px-3 py-2 text-left last:border-b-0 hover:bg-surface-secondary"
              >
                <span className="text-sm font-medium">{prediction.mainText}</span>
                <span className="text-xs text-text-muted">
                  {prediction.secondaryText}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {showMap && (
        <div className="mt-2">
          {!hasApiKey ? (
            <p className="rounded-xl bg-surface-secondary p-3 text-xs text-text-muted">
              Set VITE_GOOGLE_MAPS_API_KEY to enable the map picker.
            </p>
          ) : isLoaded ? (
            <>
              <GoogleMap
                mapContainerStyle={MAP_CONTAINER_STYLE}
                center={mapCenter}
                zoom={value ? 15 : 12}
                onClick={handleMapPointChosen}
                options={{
                  disableDefaultUI: true,
                  clickableIcons: false,
                  gestureHandling: "greedy",
                }}
              >
                {value && (
                  <MarkerF
                    position={{ lat: value.latitude, lng: value.longitude }}
                    draggable
                    onDragEnd={handleMapPointChosen}
                  />
                )}
              </GoogleMap>
              <p className="mt-1 text-[11px] text-text-muted">
                Tap the map or drag the pin to set the exact spot.
              </p>
            </>
          ) : (
            <div className="flex h-[180px] items-center justify-center rounded-xl bg-surface-secondary">
              <Loader2 className="animate-spin text-text-muted" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
