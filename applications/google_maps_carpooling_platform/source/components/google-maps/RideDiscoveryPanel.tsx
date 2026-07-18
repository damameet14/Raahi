import { CarFront, Filter, MapPin, Users } from "lucide-react";
import type {
  RideDiscoveryFilter,
  RidePreview,
} from "../../types/google-maps/rideDiscovery";
import type { VehicleSelectionPlaceholder } from "../../types/google-maps/rideDraft";

interface RideDiscoveryPanelProps {
  filteredRidePreviews: RidePreview[];
  onFilterChanged: (nextPartialFilter: Partial<RideDiscoveryFilter>) => void;
  onRidePreviewSelected: (ridePreview: RidePreview) => void;
  rideDiscoveryFilter: RideDiscoveryFilter;
  selectedRidePreviewId: string | null;
}

const DISCOVERY_VEHICLE_OPTIONS: Array<{
  label: string;
  value: VehicleSelectionPlaceholder | "any";
}> = [
  { label: "Any vehicle", value: "any" },
  { label: "Sedan", value: "sedan" },
  { label: "Compact", value: "compact-car" },
  { label: "SUV", value: "suv" },
  { label: "Shuttle", value: "company-shuttle" },
];

export function RideDiscoveryPanel({
  filteredRidePreviews,
  onFilterChanged,
  onRidePreviewSelected,
  rideDiscoveryFilter,
  selectedRidePreviewId,
}: RideDiscoveryPanelProps) {
  return (
    <section className="ride-discovery-panel" aria-label="Ride discovery">
      <div className="ride-discovery-panel__title">
        <MapPin aria-hidden="true" size={18} />
        <span>Nearby Rides</span>
      </div>

      <div className="ride-discovery-panel__filters" aria-label="Ride filters">
        <label>
          <Filter aria-hidden="true" size={15} />
          <span>Vehicle</span>
          <select
            onChange={(event) => {
              onFilterChanged({
                vehicleSelectionPlaceholder: event.target
                  .value as RideDiscoveryFilter["vehicleSelectionPlaceholder"],
              });
            }}
            value={rideDiscoveryFilter.vehicleSelectionPlaceholder}
          >
            {DISCOVERY_VEHICLE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <Users aria-hidden="true" size={15} />
          <span>Seats</span>
          <input
            min={1}
            max={6}
            onChange={(event) => {
              onFilterChanged({
                minimumAvailableSeats: Number(event.target.value),
              });
            }}
            type="number"
            value={rideDiscoveryFilter.minimumAvailableSeats}
          />
        </label>
      </div>

      <div className="ride-discovery-panel__list">
        {filteredRidePreviews.map((ridePreview) => (
          <button
            aria-pressed={ridePreview.ridePreviewId === selectedRidePreviewId}
            className="ride-preview-card"
            key={ridePreview.ridePreviewId}
            onClick={() => {
              onRidePreviewSelected(ridePreview);
            }}
            type="button"
          >
            <span className="ride-preview-card__driver">
              <CarFront aria-hidden="true" size={16} />
              {ridePreview.driverDisplayName}
            </span>
            <span>{ridePreview.pickup.formattedAddress}</span>
            <strong>
              {ridePreview.route.distanceLabel} · {ridePreview.route.etaLabel}
            </strong>
            <small>
              {ridePreview.availableSeatCount} seats ·{" "}
              {ridePreview.departureWindowLabel}
            </small>
          </button>
        ))}
      </div>
    </section>
  );
}
