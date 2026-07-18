import { CarFront, Minus, Plus, Users } from "lucide-react";
import { useRideDraft } from "../../hooks/google-maps/useRideDraft";
import type { SelectedPlace } from "../../types/google-maps/places";
import type {
  RideDraft,
  VehicleSelectionPlaceholder,
} from "../../types/google-maps/rideDraft";
import type { RouteSummary } from "../../types/google-maps/routeSummary";

interface RideCreationPanelProps {
  destination: SelectedPlace | null;
  onRideDraftCreated: (rideDraft: RideDraft) => void;
  pickup: SelectedPlace | null;
  route: RouteSummary | null;
}

const VEHICLE_OPTIONS: Array<{
  label: string;
  value: VehicleSelectionPlaceholder;
}> = [
  { label: "Sedan", value: "sedan" },
  { label: "Compact", value: "compact-car" },
  { label: "SUV", value: "suv" },
  { label: "Shuttle", value: "company-shuttle" },
];

export function RideCreationPanel({
  destination,
  onRideDraftCreated,
  pickup,
  route,
}: RideCreationPanelProps) {
  const {
    createRideDraft,
    lastRideDraftMessage,
    passengerCount,
    setPassengerCount,
    setVehicleSelectionPlaceholder,
    validationResult,
    vehicleSelectionPlaceholder,
  } = useRideDraft({
    destination,
    onRideDraftCreated,
    pickup,
    route,
  });

  return (
    <section className="ride-creation-panel" aria-label="Ride draft">
      <div className="ride-creation-panel__title">
        <CarFront aria-hidden="true" size={18} />
        <span>Ride Draft</span>
      </div>

      <div className="ride-creation-panel__row">
        <label htmlFor="vehicle-selection">Vehicle</label>
        <select
          id="vehicle-selection"
          onChange={(event) => {
            setVehicleSelectionPlaceholder(
              event.target.value as VehicleSelectionPlaceholder,
            );
          }}
          value={vehicleSelectionPlaceholder}
        >
          {VEHICLE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="ride-creation-panel__counter">
        <Users aria-hidden="true" size={17} />
        <span>Passengers</span>
        <button
          aria-label="Decrease passenger count"
          onClick={() => {
            setPassengerCount(Math.max(1, passengerCount - 1));
          }}
          type="button"
        >
          <Minus aria-hidden="true" size={15} />
        </button>
        <strong>{passengerCount}</strong>
        <button
          aria-label="Increase passenger count"
          onClick={() => {
            setPassengerCount(Math.min(6, passengerCount + 1));
          }}
          type="button"
        >
          <Plus aria-hidden="true" size={15} />
        </button>
      </div>

      {validationResult.errorMessages.length > 0 ? (
        <p className="ride-creation-panel__message" role="status">
          {validationResult.errorMessages[0]}
        </p>
      ) : null}

      {lastRideDraftMessage ? (
        <p className="ride-creation-panel__success" role="status">
          {lastRideDraftMessage}
        </p>
      ) : null}

      <button
        className="ride-creation-panel__submit"
        disabled={!validationResult.isValid}
        onClick={createRideDraft}
        type="button"
      >
        Save Session Draft
      </button>
    </section>
  );
}
