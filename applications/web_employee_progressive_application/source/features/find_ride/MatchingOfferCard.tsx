/**
 * A selectable matching-offer card (screen 1B.1) with a detail sheet (1B.1A)
 * that shows the driver's route and full details before selection.
 */

import { useState } from "react";
import { Check, MapPin } from "lucide-react";

import { BottomSheet } from "../../shared_user_interface_infrastructure/reusable_components/BottomSheet";
import { PrimaryButton } from "../../shared_user_interface_infrastructure/reusable_components/PrimaryButton";
import { RoutePreviewMap } from "../../shared_user_interface_infrastructure/maps/RoutePreviewMap";
import type { MatchingOffer } from "../../shared_user_interface_infrastructure/backend_communication/employee_api_types";

export function MatchingOfferCard({
  offer,
  isSelected,
  onSelect,
}: {
  offer: MatchingOffer;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  return (
    <div
      className={`rounded-2xl border bg-white p-4 transition ${
        isSelected
          ? "border-raahi-500 ring-1 ring-raahi-500"
          : "border-[color:var(--color-border-primary)]"
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="font-semibold">{offer.driver_full_name}</p>
          <p className="text-xs text-text-secondary">
            {offer.vehicle_make_and_model} · {offer.vehicle_number}
          </p>
        </div>
        <div className="text-right">
          <p className="font-bold">₹{offer.fare_amount.toFixed(0)}</p>
          <p className="text-xs text-text-muted">
            {offer.seats_available} seat
            {offer.seats_available > 1 ? "s" : ""} left
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2 text-xs text-text-secondary">
        <MapPin size={12} className="text-raahi-600" />
        {offer.departure_window_start_time}–{offer.departure_window_end_time} ·
        pickup {offer.pickup_distance_kilometers} km away
      </div>

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => setIsDetailOpen(true)}
          className="flex-1 rounded-xl border border-[color:var(--color-border-primary)] py-2 text-xs font-semibold text-text-secondary"
        >
          View route & details
        </button>
        <button
          type="button"
          onClick={onSelect}
          className={`flex flex-1 items-center justify-center gap-1 rounded-xl py-2 text-xs font-semibold ${
            isSelected
              ? "bg-raahi-600 text-white"
              : "bg-raahi-50 text-raahi-700"
          }`}
        >
          {isSelected && <Check size={14} />}
          {isSelected ? "Selected" : "Choose"}
        </button>
      </div>

      <BottomSheet
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title="Ride details"
        footer={
          <PrimaryButton
            onClick={() => {
              onSelect();
              setIsDetailOpen(false);
            }}
          >
            Choose this ride
          </PrimaryButton>
        }
      >
        <div className="flex flex-col gap-4">
          <RoutePreviewMap
            origin={{ lat: offer.source_latitude, lng: offer.source_longitude }}
            destination={{
              lat: offer.destination_latitude,
              lng: offer.destination_longitude,
            }}
          />
          <DetailRow label="Driver" value={offer.driver_full_name} />
          {offer.driver_designation && (
            <DetailRow label="Role" value={offer.driver_designation} />
          )}
          <DetailRow
            label="Vehicle"
            value={`${offer.vehicle_make_and_model} · ${offer.vehicle_number}`}
          />
          <DetailRow
            label="Departure window"
            value={`${offer.departure_window_start_time}–${offer.departure_window_end_time}`}
          />
          <DetailRow
            label="Pickup detour"
            value={`${offer.pickup_distance_kilometers} km`}
          />
          <DetailRow label="Fare" value={`₹${offer.fare_amount.toFixed(2)}`} />
        </div>
      </BottomSheet>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-[color:var(--color-border-primary)] pb-2 text-sm last:border-b-0">
      <span className="text-text-muted">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
