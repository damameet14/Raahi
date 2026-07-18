import {
  AlertTriangle,
  RefreshCcw,
  RotateCw,
  Route as RouteIcon,
} from "lucide-react";
import type {
  RouteSummary,
  RouteTravelMode,
} from "../../types/google-maps/routeSummary";

interface RouteEnhancementControlsProps {
  alternativeRoutes: RouteSummary[];
  isCalculatingRoute: boolean;
  onRefreshRoute: () => void;
  onRetryRoute: () => void;
  onRouteSelected: (routeId: string) => void;
  onTravelModeChanged: (travelMode: RouteTravelMode) => void;
  routeError: string | null;
  selectedRouteId: string | null;
  travelMode: RouteTravelMode;
}

const TRAVEL_MODE_OPTIONS: Array<{
  label: string;
  value: RouteTravelMode;
}> = [
  { label: "Drive", value: "DRIVE" },
  { label: "Walk", value: "WALK" },
  { label: "Bike", value: "BICYCLE" },
  { label: "Two-wheeler", value: "TWO_WHEELER" },
];

export function RouteEnhancementControls({
  alternativeRoutes,
  isCalculatingRoute,
  onRefreshRoute,
  onRetryRoute,
  onRouteSelected,
  onTravelModeChanged,
  routeError,
  selectedRouteId,
  travelMode,
}: RouteEnhancementControlsProps) {
  return (
    <section className="route-controls" aria-label="Route options">
      <div className="route-controls__header">
        <RouteIcon aria-hidden="true" size={17} />
        <span>Route Options</span>
      </div>

      <div className="route-controls__modes" role="group" aria-label="Travel mode">
        {TRAVEL_MODE_OPTIONS.map((option) => (
          <button
            aria-pressed={travelMode === option.value}
            className="route-controls__mode-button"
            key={option.value}
            onClick={() => {
              onTravelModeChanged(option.value);
            }}
            type="button"
          >
            {option.label}
          </button>
        ))}
      </div>

      <TravelModeSafetyWarning travelMode={travelMode} />

      {alternativeRoutes.length > 1 ? (
        <div className="route-controls__alternatives">
          {alternativeRoutes.map((route, index) => (
            <button
              aria-pressed={route.routeId === selectedRouteId}
              className="route-controls__alternative-button"
              key={route.routeId}
              onClick={() => {
                onRouteSelected(route.routeId);
              }}
              type="button"
            >
              <span>{index === 0 ? "Best route" : route.routeTitle}</span>
              <strong>
                {route.distanceLabel} · {route.durationLabel}
              </strong>
            </button>
          ))}
        </div>
      ) : null}

      <div className="route-controls__actions">
        <button
          className="route-controls__action-button"
          disabled={isCalculatingRoute}
          onClick={onRefreshRoute}
          type="button"
        >
          <RefreshCcw aria-hidden="true" size={16} />
          <span>{isCalculatingRoute ? "Refreshing" : "Refresh"}</span>
        </button>
        {routeError ? (
          <button
            className="route-controls__action-button"
            disabled={isCalculatingRoute}
            onClick={onRetryRoute}
            type="button"
          >
            <RotateCw aria-hidden="true" size={16} />
            <span>Retry</span>
          </button>
        ) : null}
      </div>
    </section>
  );
}

interface TravelModeSafetyWarningProps {
  travelMode: RouteTravelMode;
}

function TravelModeSafetyWarning({
  travelMode,
}: TravelModeSafetyWarningProps) {
  const warningMessage = getTravelModeSafetyWarningMessage(travelMode);

  if (!warningMessage) {
    return null;
  }

  return (
    <p className="route-controls__mode-warning" role="note">
      <AlertTriangle aria-hidden="true" size={16} />
      <span>{warningMessage}</span>
    </p>
  );
}

function getTravelModeSafetyWarningMessage(
  travelMode: RouteTravelMode,
): string | null {
  if (travelMode === "WALK") {
    return "Walking routes may not always reflect real-world sidewalks, crossings, or local conditions.";
  }

  if (travelMode === "BICYCLE") {
    return "Bicycle routes may not always reflect real-world cycling conditions, traffic, or road suitability.";
  }

  if (travelMode === "TWO_WHEELER") {
    return "Two-wheeler routes may not always reflect real-world road restrictions, traffic, or riding conditions.";
  }

  return null;
}
