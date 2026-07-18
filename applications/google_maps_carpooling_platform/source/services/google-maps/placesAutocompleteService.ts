import type { Coordinates } from "../../types/google-maps/location";
import type { PlacePrediction, SelectedPlace } from "../../types/google-maps/places";

const AHMEDABAD_ORIGIN: Coordinates = {
  lat: 23.0225,
  lng: 72.5714,
};

const AHMEDABAD_BIAS: google.maps.CircleLiteral = {
  center: AHMEDABAD_ORIGIN,
  radius: 40_000,
};

const PLACE_DETAIL_FIELDS: Array<keyof google.maps.places.Place> = [
  "formattedAddress",
  "location",
  "displayName",
];

export class PlacesAutocompleteError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PlacesAutocompleteError";
  }
}

export async function createAutocompleteSessionToken(): Promise<google.maps.places.AutocompleteSessionToken> {
  const { AutocompleteSessionToken } = await importPlacesLibrary();
  return new AutocompleteSessionToken();
}

export async function fetchPlacePredictions(
  input: string,
  sessionToken: google.maps.places.AutocompleteSessionToken,
  origin: Coordinates = AHMEDABAD_ORIGIN,
): Promise<PlacePrediction[]> {
  const trimmedInput = input.trim();

  if (trimmedInput.length < 2) {
    return [];
  }

  const { AutocompleteSuggestion } = await importPlacesLibrary();

  const response = await AutocompleteSuggestion.fetchAutocompleteSuggestions({
    includedRegionCodes: ["in"],
    input: trimmedInput,
    language: "en",
    locationBias: AHMEDABAD_BIAS,
    origin,
    region: "in",
    sessionToken,
  });

  return response.suggestions
    .map((suggestion) => suggestion.placePrediction)
    .filter((prediction): prediction is google.maps.places.PlacePrediction =>
      Boolean(prediction),
    )
    .map(toPlacePrediction);
}

export async function fetchSelectedPlace(
  prediction: google.maps.places.PlacePrediction,
): Promise<SelectedPlace> {
  const place = prediction.toPlace();

  await place.fetchFields({
    fields: PLACE_DETAIL_FIELDS,
  });

  const location = place.location;

  if (!prediction.placeId || !location) {
    throw new PlacesAutocompleteError(
      "The selected place did not include a valid place ID or location.",
    );
  }

  return {
    formattedAddress:
      place.formattedAddress ?? place.displayName ?? prediction.text.text,
    lat: location.lat(),
    lng: location.lng(),
    placeId: prediction.placeId,
  };
}

async function importPlacesLibrary(): Promise<google.maps.PlacesLibrary> {
  if (!window.google?.maps?.importLibrary) {
    throw new PlacesAutocompleteError(
      "Google Maps Places library is not available yet.",
    );
  }

  return (await google.maps.importLibrary(
    "places",
  )) as google.maps.PlacesLibrary;
}

function toPlacePrediction(
  prediction: google.maps.places.PlacePrediction,
): PlacePrediction {
  return {
    distanceMeters: prediction.distanceMeters,
    mainText: prediction.mainText?.text ?? prediction.text.text,
    placeId: prediction.placeId,
    prediction,
    secondaryText: prediction.secondaryText?.text ?? "",
    text: prediction.text.text,
  };
}
