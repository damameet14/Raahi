import { Clock3, MapPin, Navigation, Route as RouteIcon, Ruler } from "lucide-react";
import type { SelectedPlace } from "../../types/google-maps/places";
import type { RouteSummary } from "../../types/google-maps/routeSummary";

interface TripSummaryCardProps {
  destination: SelectedPlace;
  pickup: SelectedPlace;
  route: RouteSummary;
}

export function TripSummaryCard({
  destination,
  pickup,
  route,
}: TripSummaryCardProps) {
  return (
    <article className="trip-summary-card" aria-label="Trip summary">
      <div className="trip-summary-card__title">
        <RouteIcon aria-hidden="true" size={18} />
        <span>Trip Preview</span>
      </div>

      <dl className="trip-summary-card__places">
        <div className="trip-summary-card__place">
          <MapPin aria-hidden="true" size={16} />
          <dt>Pickup</dt>
          <dd>{pickup.formattedAddress}</dd>
        </div>
        <div className="trip-summary-card__place">
          <Navigation aria-hidden="true" size={16} />
          <dt>Destination</dt>
          <dd>{destination.formattedAddress}</dd>
        </div>
      </dl>

      <dl className="trip-summary-card__metrics">
        <div className="trip-summary-card__metric">
          <Ruler aria-hidden="true" size={16} />
          <dt>Distance</dt>
          <dd>{route.distanceLabel}</dd>
        </div>
        <div className="trip-summary-card__metric">
          <Clock3 aria-hidden="true" size={16} />
          <dt>ETA</dt>
          <dd>{route.etaLabel}</dd>
        </div>
      </dl>
    </article>
  );
}
