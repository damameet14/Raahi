/**
 * A selectable passenger-request card for the driver (screen 2B.1), with a
 * detail sheet showing the passenger's route (the driver's intermediate leg).
 */

import { useState } from "react";
import { Check, Users } from "lucide-react";

import { BottomSheet } from "../../shared_user_interface_infrastructure/reusable_components/BottomSheet";
import { RoutePreviewMap } from "../../shared_user_interface_infrastructure/maps/RoutePreviewMap";
import type { MatchingRequest } from "../../shared_user_interface_infrastructure/backend_communication/employee_api_types";

export function MatchingRequestCard({
  request,
  isSelected,
  onToggle,
}: {
  request: MatchingRequest;
  isSelected: boolean;
  onToggle: () => void;
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
          <p className="font-semibold">{request.passenger_full_name}</p>
          <p className="mt-0.5 truncate text-xs text-text-secondary">
            {request.source_label ?? "Pickup"} →{" "}
            {request.destination_label ?? "Drop"}
          </p>
        </div>
        <div className="text-right">
          <p className="font-bold">₹{request.fare_amount.toFixed(0)}</p>
          <p className="inline-flex items-center gap-1 text-xs text-text-muted">
            <Users size={12} /> {request.seats_requested}
          </p>
        </div>
      </div>

      <p className="mt-2 text-xs text-text-secondary">
        {request.departure_time} · pickup {request.pickup_distance_kilometers} km
        away
      </p>

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => setIsDetailOpen(true)}
          className="flex-1 rounded-xl border border-[color:var(--color-border-primary)] py-2 text-xs font-semibold text-text-secondary"
        >
          View details
        </button>
        <button
          type="button"
          onClick={onToggle}
          className={`flex flex-1 items-center justify-center gap-1 rounded-xl py-2 text-xs font-semibold ${
            isSelected ? "bg-raahi-600 text-white" : "bg-raahi-50 text-raahi-700"
          }`}
        >
          {isSelected && <Check size={14} />}
          {isSelected ? "Added" : "Add"}
        </button>
      </div>

      <BottomSheet
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title="Passenger request"
      >
        <div className="flex flex-col gap-4">
          <RoutePreviewMap
            origin={{
              lat: request.source_latitude,
              lng: request.source_longitude,
            }}
            destination={{
              lat: request.destination_latitude,
              lng: request.destination_longitude,
            }}
          />
          <DetailRow label="Passenger" value={request.passenger_full_name} />
          <DetailRow label="Seats" value={String(request.seats_requested)} />
          <DetailRow label="Departure" value={request.departure_time} />
          <DetailRow
            label="Pickup detour"
            value={`${request.pickup_distance_kilometers} km`}
          />
          <DetailRow label="Fare" value={`₹${request.fare_amount.toFixed(2)}`} />
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
