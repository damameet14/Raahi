import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Car, Pencil, Plus, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";

import { EmployeeAppHeader } from "../../shared_user_interface_infrastructure/layout/EmployeeAppHeader";
import {
  EMPLOYEE_PROFILE_QUERY_KEY,
} from "../../shared_user_interface_infrastructure/employee_profile/useEmployeeProfileQuery";
import {
  deleteMyVehicle,
  listMyVehicles,
  registerMyVehicle,
  updateMyVehicle,
  type RegisterVehiclePayload,
} from "../../shared_user_interface_infrastructure/backend_communication/employee_account_api";
import type { VehicleSummary } from "../../shared_user_interface_infrastructure/backend_communication/employee_api_types";
import { extractApiErrorMessage } from "../../shared_user_interface_infrastructure/backend_communication/extractApiErrorMessage";
import {
  isValidVehicleRegistrationNumber,
  normalizeVehicleRegistrationNumber,
  VEHICLE_REGISTRATION_NUMBER_HELP,
} from "../../shared_user_interface_infrastructure/validation/vehicleRegistrationNumber";

const MAXIMUM_PASSENGER_CAPACITY = 8;

interface VehicleFormState {
  make: string;
  model: string;
  vehicleNumber: string;
  maximumPassengers: string;
  fuelType: string;
  color: string;
}

const emptyVehicleForm: VehicleFormState = {
  make: "",
  model: "",
  vehicleNumber: "",
  maximumPassengers: "4",
  fuelType: "PETROL",
  color: "",
};

export function VehicleManagementPage() {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<VehicleSummary | null>(
    null,
  );
  const [formState, setFormState] = useState<VehicleFormState>(emptyVehicleForm);

  const vehiclesQuery = useQuery({
    queryKey: ["employee-vehicles"],
    queryFn: listMyVehicles,
  });

  const saveVehicleMutation = useMutation({
    mutationFn: async () => {
      const payload: RegisterVehiclePayload = {
        make: formState.make.trim(),
        model: formState.model.trim(),
        vehicle_number: normalizeVehicleRegistrationNumber(formState.vehicleNumber),
        maximum_passengers: Number(formState.maximumPassengers),
        fuel_type: formState.fuelType,
        color: formState.color.trim() || null,
      };
      if (editingVehicle) {
        return updateMyVehicle(editingVehicle.id, payload);
      }
      return registerMyVehicle(payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["employee-vehicles"] });
      await queryClient.invalidateQueries({ queryKey: EMPLOYEE_PROFILE_QUERY_KEY });
      toast.success(editingVehicle ? "Vehicle updated" : "Vehicle added");
      closeForm();
    },
    onError: (error) => {
      toast.error(extractApiErrorMessage(error, "Could not save vehicle"));
    },
  });

  const deleteVehicleMutation = useMutation({
    mutationFn: deleteMyVehicle,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["employee-vehicles"] });
      await queryClient.invalidateQueries({ queryKey: EMPLOYEE_PROFILE_QUERY_KEY });
      toast.success("Vehicle removed");
    },
    onError: (error) => {
      toast.error(extractApiErrorMessage(error, "Could not remove vehicle"));
    },
  });

  function openCreateForm() {
    setEditingVehicle(null);
    setFormState(emptyVehicleForm);
    setIsFormOpen(true);
  }

  function openEditForm(vehicle: VehicleSummary) {
    setEditingVehicle(vehicle);
    setFormState({
      make: vehicle.make,
      model: vehicle.model,
      vehicleNumber: vehicle.vehicle_number,
      maximumPassengers: String(vehicle.maximum_passengers),
      fuelType: vehicle.fuel_type,
      color: vehicle.color ?? "",
    });
    setIsFormOpen(true);
  }

  function closeForm() {
    setIsFormOpen(false);
    setEditingVehicle(null);
    setFormState(emptyVehicleForm);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (
      !formState.make.trim() ||
      !formState.model.trim() ||
      !formState.vehicleNumber.trim()
    ) {
      toast.error("Enter vehicle make, model, and registration number");
      return;
    }
    if (!isValidVehicleRegistrationNumber(formState.vehicleNumber)) {
      toast.error(VEHICLE_REGISTRATION_NUMBER_HELP);
      return;
    }
    const passengerCapacity = Number(formState.maximumPassengers);
    if (!Number.isInteger(passengerCapacity) || passengerCapacity < 1) {
      toast.error("Passenger capacity must be at least 1");
      return;
    }
    if (passengerCapacity > MAXIMUM_PASSENGER_CAPACITY) {
      toast.error(`Passenger capacity cannot exceed ${MAXIMUM_PASSENGER_CAPACITY}`);
      return;
    }
    saveVehicleMutation.mutate();
  }

  return (
    <div className="min-h-screen pb-10">
      <EmployeeAppHeader title="My Vehicles" leftAction="menu" />

      <div className="px-4 py-4">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">Vehicle Management</h2>
            <p className="text-xs text-text-muted">
              Add and maintain vehicles you use to offer rides.
            </p>
          </div>
          <button
            type="button"
            onClick={openCreateForm}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-raahi-600 text-white"
            aria-label="Add vehicle"
          >
            <Plus size={20} />
          </button>
        </div>

        {vehiclesQuery.isLoading ? (
          <EmptyState message="Loading vehicles..." />
        ) : vehiclesQuery.data && vehiclesQuery.data.length > 0 ? (
          <div className="flex flex-col gap-3">
            {vehiclesQuery.data.map((vehicle) => (
              <article
                key={vehicle.id}
                className="rounded-2xl border border-[color:var(--color-border-primary)] bg-white p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-raahi-50 text-raahi-700">
                    <Car size={22} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold">
                      {vehicle.make} {vehicle.model}
                    </p>
                    <p className="text-sm text-text-secondary">
                      {vehicle.vehicle_number}
                    </p>
                    <p className="mt-1 text-xs text-text-muted">
                      {vehicle.maximum_passengers} seats · {vehicle.fuel_type}
                      {vehicle.color ? ` · ${vehicle.color}` : ""}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => openEditForm(vehicle)}
                      className="rounded-lg p-2 text-text-secondary hover:bg-surface-secondary"
                      aria-label="Edit vehicle"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteVehicleMutation.mutate(vehicle.id)}
                      disabled={deleteVehicleMutation.isPending}
                      className="rounded-lg p-2 text-rose-500 hover:bg-rose-50 disabled:opacity-60"
                      aria-label="Remove vehicle"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState message="No vehicles yet. Add one to offer rides." />
        )}
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex justify-center bg-black/50">
          <div className="mt-auto w-full max-w-[480px] rounded-t-3xl bg-white p-4 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-bold">
                {editingVehicle ? "Edit Vehicle" : "Add Vehicle"}
              </h3>
              <button type="button" onClick={closeForm} aria-label="Close">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="grid gap-3">
              <TextInput label="Make" value={formState.make} onChange={(make) => setFormState((current) => ({ ...current, make }))} />
              <TextInput label="Model" value={formState.model} onChange={(model) => setFormState((current) => ({ ...current, model }))} />
              <div>
                <TextInput label="Registration number" value={formState.vehicleNumber} onChange={(vehicleNumber) => setFormState((current) => ({ ...current, vehicleNumber: vehicleNumber.toUpperCase() }))} />
                <p className="mt-1 text-[11px] text-text-muted">{VEHICLE_REGISTRATION_NUMBER_HELP}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <TextInput label="Seats" type="number" min={1} max={MAXIMUM_PASSENGER_CAPACITY} value={formState.maximumPassengers} onChange={(maximumPassengers) => setFormState((current) => ({ ...current, maximumPassengers }))} />
                <label className="grid gap-1 text-xs font-semibold text-text-secondary">
                  Fuel type
                  <select
                    value={formState.fuelType}
                    onChange={(event) => setFormState((current) => ({ ...current, fuelType: event.target.value }))}
                    className="rounded-xl border border-[color:var(--color-border-primary)] bg-white px-3 py-3 text-sm text-text-primary outline-none focus:border-raahi-500"
                  >
                    <option value="PETROL">Petrol</option>
                    <option value="DIESEL">Diesel</option>
                    <option value="CNG">CNG</option>
                    <option value="ELECTRIC">Electric</option>
                  </select>
                </label>
              </div>
              <TextInput label="Color" value={formState.color} onChange={(color) => setFormState((current) => ({ ...current, color }))} />
              <button
                type="submit"
                disabled={saveVehicleMutation.isPending}
                className="mt-2 rounded-xl bg-raahi-600 px-4 py-3 text-sm font-bold text-white disabled:opacity-60"
              >
                {saveVehicleMutation.isPending ? "Saving..." : "Save vehicle"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function TextInput({
  label,
  value,
  onChange,
  type = "text",
  min,
  max,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  min?: number;
  max?: number;
}) {
  return (
    <label className="grid gap-1 text-xs font-semibold text-text-secondary">
      {label}
      <input
        type={type}
        value={value}
        min={min}
        max={max}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-xl border border-[color:var(--color-border-primary)] bg-white px-3 py-3 text-sm text-text-primary outline-none focus:border-raahi-500"
      />
    </label>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-[color:var(--color-border-secondary)] bg-surface-secondary p-6 text-center text-sm text-text-muted">
      {message}
    </div>
  );
}
