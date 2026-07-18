import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CircleF,
  GoogleMap as GoogleMapCanvas,
  OVERLAY_MOUSE_TARGET,
  OverlayViewF,
  PolylineF,
  type Libraries,
  useJsApiLoader,
} from "@react-google-maps/api";
import { Clock3, LocateFixed, MapPin, Route as RouteIcon, Ruler } from "lucide-react";
import { DestinationSearch } from "./places/DestinationSearch";
import { PickupSearch } from "./places/PickupSearch";
import { useRouteCalculation } from "../../hooks/google-maps/useRouteCalculation";
import { useSelectedPlaces } from "../../hooks/google-maps/useSelectedPlaces";
import { getGoogleMapsApiKey } from "../../services/google-maps/googleMapsConfiguration";
import { getCurrentBrowserLocation } from "../../services/google-maps/browserGeolocation";
import type { Coordinates } from "../../types/google-maps/location";
import type { PlaceSearchRole, SelectedPlace } from "../../types/google-maps/places";
import type { RouteSummary } from "../../types/google-maps/routeSummary";
import "./GoogleMap.css";

const GOOGLE_MAPS_LIBRARIES: Libraries = ["places"];

const AHMEDABAD_CENTER: Coordinates = {
  lat: 23.0225,
  lng: 72.5714,
};

const MAP_CONTAINER_STYLE = {
  width: "100%",
  height: "100%",
};

const MAP_OPTIONS: google.maps.MapOptions = {
  clickableIcons: false,
  fullscreenControl: true,
  mapTypeControl: false,
  streetViewControl: false,
  zoomControl: true,
};

const AHMEDABAD_CIRCLE_OPTIONS: google.maps.CircleOptions = {
  clickable: false,
  fillColor: "#156c5c",
  fillOpacity: 0.18,
  strokeColor: "#156c5c",
  strokeOpacity: 0.85,
  strokeWeight: 2,
};

const USER_LOCATION_CIRCLE_OPTIONS: google.maps.CircleOptions = {
  clickable: false,
  fillColor: "#1d4ed8",
  fillOpacity: 0.2,
  strokeColor: "#1d4ed8",
  strokeOpacity: 0.9,
  strokeWeight: 2,
};

const ROUTE_POLYLINE_OPTIONS: google.maps.PolylineOptions = {
  clickable: false,
  geodesic: true,
  strokeColor: "#175cd3",
  strokeOpacity: 0.92,
  strokeWeight: 5,
  zIndex: 2,
};

const SELECTED_PLACE_ZOOM = 15;

type ApiKeyState =
  | { status: "ready"; apiKey: string }
  | { status: "error"; message: string };

export function GoogleMap() {
  const apiKeyState = useMemo<ApiKeyState>(() => {
    try {
      return { status: "ready", apiKey: getGoogleMapsApiKey() };
    } catch (error) {
      return {
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "Google Maps configuration is invalid.",
      };
    }
  }, []);

  if (apiKeyState.status === "error") {
    return <MapState title="Map configuration error" message={apiKeyState.message} />;
  }

  return <LoadedGoogleMap apiKey={apiKeyState.apiKey} />;
}

interface LoadedGoogleMapProps {
  apiKey: string;
}

function LoadedGoogleMap({ apiKey }: LoadedGoogleMapProps) {
  const mapRef = useRef<google.maps.Map | null>(null);
  const [center, setCenter] = useState<Coordinates>(AHMEDABAD_CENTER);
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const { selectedPlaces, setSelectedPlace } = useSelectedPlaces();
  const { isCalculatingRoute, route, routeError } = useRouteCalculation({
    apiKey,
    destination: selectedPlaces.destination,
    pickup: selectedPlaces.pickup,
  });
  const hasRouteInputs = Boolean(
    selectedPlaces.pickup && selectedPlaces.destination,
  );

  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-maps-script",
    googleMapsApiKey: apiKey,
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  const handleMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  const handleMapUnmount = useCallback(() => {
    mapRef.current = null;
  }, []);

  const handleCurrentLocation = useCallback(async () => {
    setIsLocating(true);
    setLocationError(null);

    try {
      const location = await getCurrentBrowserLocation();
      setUserLocation(location);
      setCenter(location);
      mapRef.current?.panTo(location);
      mapRef.current?.setZoom(15);
    } catch (error) {
      setLocationError(
        error instanceof Error
          ? error.message
          : "Unable to get current location.",
      );
    } finally {
      setIsLocating(false);
    }
  }, []);

  const handlePlaceSelected = useCallback(
    (role: PlaceSearchRole, place: SelectedPlace) => {
      const selectedCenter = {
        lat: place.lat,
        lng: place.lng,
      };

      setSelectedPlace(role, place);
      setCenter(selectedCenter);
      mapRef.current?.panTo(selectedCenter);
      mapRef.current?.setZoom(SELECTED_PLACE_ZOOM);
    },
    [setSelectedPlace],
  );

  useEffect(() => {
    if (!route || route.path.length === 0 || !mapRef.current) {
      return;
    }

    const bounds = new google.maps.LatLngBounds();
    route.path.forEach((point) => {
      bounds.extend(point);
    });
    mapRef.current.fitBounds(bounds, 72);
  }, [route]);

  if (loadError) {
    return (
      <MapState
        title="Map loading failed"
        message="Google Maps could not load. Check the API key, billing, enabled APIs, and browser key restrictions."
      />
    );
  }

  if (!isLoaded) {
    return <MapState title="Loading map" message="Preparing Google Maps..." />;
  }

  return (
    <main className="map-page" aria-label="Enterprise carpooling map">
      <GoogleMapCanvas
        center={center}
        mapContainerStyle={MAP_CONTAINER_STYLE}
        onLoad={handleMapLoad}
        onUnmount={handleMapUnmount}
        options={MAP_OPTIONS}
        zoom={12}
      >
        <CircleF
          center={AHMEDABAD_CENTER}
          options={AHMEDABAD_CIRCLE_OPTIONS}
          radius={120}
        />
        {userLocation ? (
          <CircleF
            center={userLocation}
            options={USER_LOCATION_CIRCLE_OPTIONS}
            radius={75}
          />
        ) : null}
        {route ? (
          <PolylineF options={ROUTE_POLYLINE_OPTIONS} path={route.path} />
        ) : null}
        {selectedPlaces.pickup ? (
          <SelectedPlaceMarker
            label="P"
            place={selectedPlaces.pickup}
            role="pickup"
          />
        ) : null}
        {selectedPlaces.destination ? (
          <SelectedPlaceMarker
            label="D"
            place={selectedPlaces.destination}
            role="destination"
          />
        ) : null}
      </GoogleMapCanvas>

      <section className="map-panel" aria-label="Map search and controls">
        <div className="map-panel__header">
          <div className="map-toolbar__title">
            <MapPin aria-hidden="true" size={18} />
            <span>Ahmedabad Map</span>
          </div>

          <button
            className="map-toolbar__button"
            disabled={isLocating}
            onClick={handleCurrentLocation}
            type="button"
          >
            <LocateFixed aria-hidden="true" size={18} />
            <span>{isLocating ? "Locating..." : "Current Location"}</span>
          </button>
        </div>

        <div className="map-panel__search">
          <PickupSearch
            onPlaceSelected={(place) => {
              handlePlaceSelected("pickup", place);
            }}
            origin={center}
            selectedPlace={selectedPlaces.pickup}
          />
          <DestinationSearch
            onPlaceSelected={(place) => {
              handlePlaceSelected("destination", place);
            }}
            origin={center}
            selectedPlace={selectedPlaces.destination}
          />
        </div>

        <RouteSummaryPanel
          hasRouteInputs={hasRouteInputs}
          isCalculatingRoute={isCalculatingRoute}
          route={route}
          routeError={routeError}
        />

        {locationError ? (
          <p className="map-toolbar__message" role="status">
            {locationError}
          </p>
        ) : null}
      </section>
    </main>
  );
}

interface RouteSummaryPanelProps {
  hasRouteInputs: boolean;
  isCalculatingRoute: boolean;
  route: RouteSummary | null;
  routeError: string | null;
}

function RouteSummaryPanel({
  hasRouteInputs,
  isCalculatingRoute,
  route,
  routeError,
}: RouteSummaryPanelProps) {
  if (!hasRouteInputs) {
    return null;
  }

  if (isCalculatingRoute) {
    return (
      <div className="route-summary route-summary--loading" role="status">
        <RouteIcon aria-hidden="true" size={18} />
        <span>Calculating route...</span>
      </div>
    );
  }

  if (routeError) {
    return (
      <div className="route-summary route-summary--error" role="alert">
        <RouteIcon aria-hidden="true" size={18} />
        <span>{routeError}</span>
      </div>
    );
  }

  if (!route) {
    return null;
  }

  return (
    <div className="route-summary" aria-label="Calculated route summary">
      <div className="route-summary__title">
        <RouteIcon aria-hidden="true" size={18} />
        <span>Route calculated</span>
      </div>
      <dl className="route-summary__stats">
        <div className="route-summary__stat">
          <Ruler aria-hidden="true" size={16} />
          <dt>Distance</dt>
          <dd>{route.distanceLabel}</dd>
        </div>
        <div className="route-summary__stat">
          <Clock3 aria-hidden="true" size={16} />
          <dt>Drive time</dt>
          <dd>{route.durationLabel}</dd>
        </div>
      </dl>
    </div>
  );
}

interface SelectedPlaceMarkerProps {
  label: string;
  place: SelectedPlace;
  role: PlaceSearchRole;
}

function SelectedPlaceMarker({ label, place, role }: SelectedPlaceMarkerProps) {
  return (
    <OverlayViewF
      mapPaneName={OVERLAY_MOUSE_TARGET}
      position={{ lat: place.lat, lng: place.lng }}
    >
      <div
        aria-label={`${role} marker: ${place.formattedAddress}`}
        className={`selected-place-marker selected-place-marker--${role}`}
        title={place.formattedAddress}
      >
        {label}
      </div>
    </OverlayViewF>
  );
}

interface MapStateProps {
  title: string;
  message: string;
}

function MapState({ title, message }: MapStateProps) {
  return (
    <main className="map-state" role="status">
      <div className="map-state__panel">
        <MapPin aria-hidden="true" size={28} />
        <h1>{title}</h1>
        <p>{message}</p>
      </div>
    </main>
  );
}
