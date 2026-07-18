import type { Libraries } from "@react-google-maps/api";
import type { Coordinates } from "../../types/google-maps/location";

export const GOOGLE_MAPS_LIBRARIES: Libraries = ["places"];

export const AHMEDABAD_CENTER: Coordinates = {
  lat: 23.0225,
  lng: 72.5714,
};

export const MAP_CONTAINER_STYLE = {
  width: "100%",
  height: "100%",
};

export const MAP_OPTIONS: google.maps.MapOptions = {
  clickableIcons: false,
  fullscreenControl: true,
  mapTypeControl: false,
  streetViewControl: false,
  zoomControl: true,
};

export const AHMEDABAD_CIRCLE_OPTIONS: google.maps.CircleOptions = {
  clickable: false,
  fillColor: "#156c5c",
  fillOpacity: 0.18,
  strokeColor: "#156c5c",
  strokeOpacity: 0.85,
  strokeWeight: 2,
};

export const USER_LOCATION_CIRCLE_OPTIONS: google.maps.CircleOptions = {
  clickable: false,
  fillColor: "#1d4ed8",
  fillOpacity: 0.2,
  strokeColor: "#1d4ed8",
  strokeOpacity: 0.9,
  strokeWeight: 2,
};

export const ROUTE_POLYLINE_OPTIONS: google.maps.PolylineOptions = {
  clickable: false,
  geodesic: true,
  strokeColor: "#175cd3",
  strokeOpacity: 0.92,
  strokeWeight: 5,
  zIndex: 2,
};

export const ALTERNATIVE_ROUTE_POLYLINE_OPTIONS: google.maps.PolylineOptions = {
  clickable: false,
  geodesic: true,
  strokeColor: "#667085",
  strokeOpacity: 0.48,
  strokeWeight: 4,
  zIndex: 1,
};

export const TRIP_PREVIEW_POLYLINE_OPTIONS: google.maps.PolylineOptions = {
  clickable: false,
  geodesic: true,
  strokeColor: "#a84217",
  strokeOpacity: 0.82,
  strokeWeight: 4,
  zIndex: 3,
};

export const SELECTED_PLACE_ZOOM = 15;
