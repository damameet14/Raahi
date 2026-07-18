import type { KeyboardEvent } from "react";
import { LoaderCircle, MapPin, Navigation } from "lucide-react";
import { usePlaceAutocomplete } from "../../../hooks/google-maps/usePlaceAutocomplete";
import type { Coordinates } from "../../../types/google-maps/location";
import type { PlaceSearchRole, SelectedPlace } from "../../../types/google-maps/places";
import "./PlaceAutocomplete.css";

interface PlaceAutocompleteProps {
  label: string;
  origin: Coordinates;
  placeholder: string;
  role: PlaceSearchRole;
  selectedPlace: SelectedPlace | null;
  onPlaceSelected: (place: SelectedPlace) => void;
}

export function PlaceAutocomplete({
  label,
  origin,
  placeholder,
  role,
  selectedPlace,
  onPlaceSelected,
}: PlaceAutocompleteProps) {
  const autocomplete = usePlaceAutocomplete({
    onPlaceSelected,
    origin,
  });

  const listboxId = `${role}-place-suggestions`;
  const hasSearchText = autocomplete.inputValue.trim().length >= 2;
  const showListbox = Boolean(
    autocomplete.isOpen &&
      (autocomplete.predictions.length > 0 ||
        autocomplete.isSearching ||
        autocomplete.error ||
        hasSearchText),
  );

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      autocomplete.moveHighlight(1);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      autocomplete.moveHighlight(-1);
      return;
    }

    if (event.key === "Enter") {
      const highlightedPrediction =
        autocomplete.predictions[autocomplete.highlightedIndex];

      if (highlightedPrediction) {
        event.preventDefault();
        void autocomplete.selectPrediction(highlightedPrediction);
      }
      return;
    }

    if (event.key === "Escape") {
      autocomplete.closeSuggestions();
    }
  }

  return (
    <div className="place-autocomplete">
      <label className="place-autocomplete__label" htmlFor={`${role}-search`}>
        {label}
      </label>

      <div className="place-autocomplete__input-shell">
        {role === "pickup" ? (
          <MapPin aria-hidden="true" size={18} />
        ) : (
          <Navigation aria-hidden="true" size={18} />
        )}
        <input
          aria-activedescendant={
            autocomplete.highlightedIndex >= 0
              ? `${listboxId}-${autocomplete.highlightedIndex}`
              : undefined
          }
          aria-autocomplete="list"
          aria-controls={listboxId}
          aria-expanded={showListbox}
          autoComplete="off"
          className="place-autocomplete__input"
          disabled={autocomplete.isResolvingPlace}
          id={`${role}-search`}
          onChange={(event) => {
            autocomplete.setInputValue(event.target.value);
          }}
          onFocus={() => {
            if (autocomplete.predictions.length > 0) {
              autocomplete.setHighlightedIndex(0);
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          role="combobox"
          type="search"
          value={autocomplete.inputValue}
        />
        {(autocomplete.isSearching || autocomplete.isResolvingPlace) && (
          <LoaderCircle
            aria-hidden="true"
            className="place-autocomplete__spinner"
            size={18}
          />
        )}
      </div>

      {selectedPlace ? (
        <p className="place-autocomplete__selected">
          Selected: {selectedPlace.formattedAddress}
        </p>
      ) : null}

      {showListbox ? (
        <div
          className="place-autocomplete__menu"
          id={listboxId}
          role="listbox"
        >
          {autocomplete.error ? (
            <p className="place-autocomplete__state" role="alert">
              {autocomplete.error}
            </p>
          ) : null}

          {!autocomplete.error && autocomplete.isSearching ? (
            <p className="place-autocomplete__state">Searching places...</p>
          ) : null}

          {!autocomplete.error &&
          !autocomplete.isSearching &&
          autocomplete.predictions.length === 0 &&
          hasSearchText ? (
            <p className="place-autocomplete__state">No places found.</p>
          ) : null}

          {!autocomplete.error &&
            autocomplete.predictions.map((prediction, index) => (
              <button
                aria-selected={index === autocomplete.highlightedIndex}
                className="place-autocomplete__option"
                id={`${listboxId}-${index}`}
                key={prediction.placeId}
                onClick={() => {
                  void autocomplete.selectPrediction(prediction);
                }}
                onMouseEnter={() => {
                  autocomplete.setHighlightedIndex(index);
                }}
                role="option"
                type="button"
              >
                <span className="place-autocomplete__option-main">
                  {prediction.mainText}
                </span>
                {prediction.secondaryText ? (
                  <span className="place-autocomplete__option-secondary">
                    {prediction.secondaryText}
                  </span>
                ) : null}
              </button>
            ))}
        </div>
      ) : null}
    </div>
  );
}
