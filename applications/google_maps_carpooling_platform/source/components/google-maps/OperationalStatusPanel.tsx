import { BadgeCheck, CarFront, MapPinned, Route as RouteIcon } from "lucide-react";

interface OperationalStatusPanelProps {
  availableRideCount: number;
  hasCalculatedRoute: boolean;
  rideDraftCount: number;
}

export function OperationalStatusPanel({
  availableRideCount,
  hasCalculatedRoute,
  rideDraftCount,
}: OperationalStatusPanelProps) {
  return (
    <section className="operational-status-panel" aria-label="Raahi pilot status">
      <div className="operational-status-panel__brand">
        <BadgeCheck aria-hidden="true" size={18} />
        <span>Raahi Pilot</span>
      </div>
      <dl className="operational-status-panel__metrics">
        <div>
          <RouteIcon aria-hidden="true" size={15} />
          <dt>Route</dt>
          <dd>{hasCalculatedRoute ? "Ready" : "Pending"}</dd>
        </div>
        <div>
          <CarFront aria-hidden="true" size={15} />
          <dt>Drafts</dt>
          <dd>{rideDraftCount}</dd>
        </div>
        <div>
          <MapPinned aria-hidden="true" size={15} />
          <dt>Rides</dt>
          <dd>{availableRideCount}</dd>
        </div>
      </dl>
    </section>
  );
}
