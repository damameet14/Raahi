import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CircleF,
  GoogleMap as GoogleMapCanvas,
  OVERLAY_MOUSE_TARGET,
  OverlayViewF,
  PolylineF,
  useJsApiLoader,
} from "@react-google-maps/api";
import { LocateFixed, MapPin, Route as RouteIcon } from "lucide-react";
import { OperationalStatusPanel } from "./OperationalStatusPanel";
import { RideCreationPanel } from "./RideCreationPanel";
import { RideDiscoveryPanel } from "./RideDiscoveryPanel";
import { RouteEnhancementControls } from "./RouteEnhancementControls";
import { TripSummaryCard } from "./TripSummaryCard";
import { TripVisualizationPanel } from "./TripVisualizationPanel";
import { useRideDiscovery } from "../../hooks/google-maps/useRideDiscovery";
import { useTripVisualization } from "../../hooks/google-maps/useTripVisualization";
import { DestinationSearch } from "./places/DestinationSearch";
import { PickupSearch } from "./places/PickupSearch";
import {
  AHMEDABAD_CENTER,
  AHMEDABAD_CIRCLE_OPTIONS,
  ALTERNATIVE_ROUTE_POLYLINE_OPTIONS,
  GOOGLE_MAPS_LIBRARIES,
  MAP_CONTAINER_STYLE,
  MAP_OPTIONS,
  ROUTE_POLYLINE_OPTIONS,
  SELECTED_PLACE_ZOOM,
  TRIP_PREVIEW_POLYLINE_OPTIONS,
  USER_LOCATION_CIRCLE_OPTIONS,
} from "../../constants/google-maps/mapDisplayConfiguration";
import { useRouteCalculation } from "../../hooks/google-maps/useRouteCalculation";
import { useSelectedPlaces } from "../../hooks/google-maps/useSelectedPlaces";
import { getGoogleMapsApiKey } from "../../services/google-maps/googleMapsConfiguration";
import { getCurrentBrowserLocation } from "../../services/google-maps/browserGeolocation";
import type { Coordinates } from "../../types/google-maps/location";
import type { PlaceSearchRole, SelectedPlace } from "../../types/google-maps/places";
import type { RideMarkerCluster } from "../../types/google-maps/rideDiscovery";
import type { RideDraft } from "../../types/google-maps/rideDraft";
import type { RouteSummary } from "../../types/google-maps/routeSummary";
import "./GoogleMap.css";

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
  const mapInstanceReference = useRef<google.maps.Map | null>(null);
  const [center, setCenter] = useState<Coordinates>(AHMEDABAD_CENTER);
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [rideDrafts, setRideDrafts] = useState<RideDraft[]>([]);
  const { selectedPlaces, setSelectedPlace } = useSelectedPlaces();
  const {
    isCalculatingRoute,
    refreshRoute,
    route,
    routeError,
    routes,
    selectedRouteId,
    setSelectedRouteId,
    setTravelMode,
    travelMode,
  } = useRouteCalculation({
    apiKey,
    destination: selectedPlaces.destination,
    pickup: selectedPlaces.pickup,
  });
  const {
    filteredRidePreviews,
    markerClusters,
    previewRide,
    rideDiscoveryFilter,
    selectedRidePreview,
    selectedRidePreviewId,
    updateRideDiscoveryFilter,
  } = useRideDiscovery({
    referenceLocation: selectedPlaces.pickup,
    rideDrafts,
  });
  const tripVisualizationState = useTripVisualization({
    ridePreview: selectedRidePreview,
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
    mapInstanceReference.current = map;
  }, []);

  const handleMapUnmount = useCallback(() => {
    mapInstanceReference.current = null;
  }, []);

  const handleCurrentLocation = useCallback(async () => {
    setIsLocating(true);
    setLocationError(null);

    try {
      const location = await getCurrentBrowserLocation();
      setUserLocation(location);
      setCenter(location);
      mapInstanceReference.current?.panTo(location);
      mapInstanceReference.current?.setZoom(15);
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
      mapInstanceReference.current?.panTo(selectedCenter);
      mapInstanceReference.current?.setZoom(SELECTED_PLACE_ZOOM);
    },
    [setSelectedPlace],
  );

  const handleRideDraftCreated = useCallback((rideDraft: RideDraft) => {
    setRideDrafts((currentRideDrafts) => [rideDraft, ...currentRideDrafts]);
  }, []);

  useEffect(() => {
    if (!route || route.path.length === 0 || !mapInstanceReference.current) {
      return;
    }

    const bounds = new google.maps.LatLngBounds();
    route.path.forEach((point) => {
      bounds.extend(point);
    });
    mapInstanceReference.current.fitBounds(bounds, 72);
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
        {routes
          .filter((routeOption) => routeOption.routeId !== route?.routeId)
          .map((routeOption) => (
            <PolylineF
              key={routeOption.routeId}
              options={ALTERNATIVE_ROUTE_POLYLINE_OPTIONS}
              path={routeOption.path}
            />
          ))}
        {route ? (
          <PolylineF options={ROUTE_POLYLINE_OPTIONS} path={route.path} />
        ) : null}
        {tripVisualizationState ? (
          <PolylineF
            options={TRIP_PREVIEW_POLYLINE_OPTIONS}
            path={tripVisualizationState.routePath}
          />
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
        {markerClusters.map((markerCluster) => (
          <RideDiscoveryMarker
            key={markerCluster.clusterId}
            markerCluster={markerCluster}
            selectedRidePreviewId={selectedRidePreviewId}
          />
        ))}
        {tripVisualizationState ? (
          <>
            <TripOverlayMarker
              label="Start"
              position={tripVisualizationState.ridePreview.pickup}
              variant="pickup"
            />
            <TripOverlayMarker
              label="End"
              position={tripVisualizationState.destinationPosition}
              variant="destination"
            />
          </>
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

        <OperationalStatusPanel
          availableRideCount={filteredRidePreviews.length}
          hasCalculatedRoute={Boolean(route)}
          rideDraftCount={rideDrafts.length}
        />

        <RouteSummaryPanel
          destination={selectedPlaces.destination}
          isCalculatingRoute={isCalculatingRoute}
          pickup={selectedPlaces.pickup}
          route={route}
          routeError={routeError}
        />

        {hasRouteInputs ? (
          <RouteEnhancementControls
            alternativeRoutes={routes}
            isCalculatingRoute={isCalculatingRoute}
            onRefreshRoute={refreshRoute}
            onRetryRoute={refreshRoute}
            onRouteSelected={setSelectedRouteId}
            onTravelModeChanged={setTravelMode}
            routeError={routeError}
            selectedRouteId={selectedRouteId}
            travelMode={travelMode}
          />
        ) : null}

        <RideCreationPanel
          destination={selectedPlaces.destination}
          onRideDraftCreated={handleRideDraftCreated}
          pickup={selectedPlaces.pickup}
          route={route}
        />

        {rideDrafts.length > 0 ? (
          <p className="map-toolbar__message" role="status">
            {rideDrafts.length} session ride draft
            {rideDrafts.length === 1 ? "" : "s"} ready for discovery.
          </p>
        ) : null}

        <RideDiscoveryPanel
          filteredRidePreviews={filteredRidePreviews}
          onFilterChanged={updateRideDiscoveryFilter}
          onRidePreviewSelected={previewRide}
          rideDiscoveryFilter={rideDiscoveryFilter}
          selectedRidePreviewId={selectedRidePreviewId}
        />

        {selectedRidePreview ? (
          <p className="map-toolbar__message" role="status">
            Previewing {selectedRidePreview.driverDisplayName}'s ride to{" "}
            {selectedRidePreview.destination.formattedAddress}.
          </p>
        ) : null}

        <TripVisualizationPanel
          tripVisualizationState={tripVisualizationState}
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
  destination: SelectedPlace | null;
  isCalculatingRoute: boolean;
  pickup: SelectedPlace | null;
  route: RouteSummary | null;
  routeError: string | null;
}

function RouteSummaryPanel({
  destination,
  isCalculatingRoute,
  pickup,
  route,
  routeError,
}: RouteSummaryPanelProps) {
  const hasRouteInputs = Boolean(pickup && destination);

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

  if (!pickup || !destination) {
    return null;
  }

  return (
    <TripSummaryCard destination={destination} pickup={pickup} route={route} />
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

interface RideDiscoveryMarkerProps {
  markerCluster: RideMarkerCluster;
  selectedRidePreviewId: string | null;
}

function RideDiscoveryMarker({
  markerCluster,
  selectedRidePreviewId,
}: RideDiscoveryMarkerProps) {
  const isSelectedCluster =
    selectedRidePreviewId != null &&
    markerCluster.ridePreviewIds.includes(selectedRidePreviewId);

  return (
    <OverlayViewF
      mapPaneName={OVERLAY_MOUSE_TARGET}
      position={markerCluster.position}
    >
      <div
        aria-label={`${markerCluster.rideCount} available ride marker`}
        className={`ride-discovery-marker${
          isSelectedCluster ? " ride-discovery-marker--selected" : ""
        }`}
      >
        {markerCluster.rideCount}
      </div>
    </OverlayViewF>
  );
}

interface TripOverlayMarkerProps {
  label: string;
  position: Coordinates;
  variant: "pickup" | "destination";
}

function TripOverlayMarker({
  label,
  position,
  variant,
}: TripOverlayMarkerProps) {
  return (
    <OverlayViewF mapPaneName={OVERLAY_MOUSE_TARGET} position={position}>
      <div
        aria-label={`Trip ${variant}: ${label}`}
        className={`trip-overlay-marker trip-overlay-marker--${variant}`}
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
