import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MapPin, Pencil, Plus, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";

import { EmployeeAppHeader } from "../../shared_user_interface_infrastructure/layout/EmployeeAppHeader";
import { LocationSelectorField } from "../../shared_user_interface_infrastructure/maps/LocationSelectorField";
import type { SelectedLocation } from "../../shared_user_interface_infrastructure/maps/types/selectedLocation";
import {
  createMySavedPlace,
  deleteMySavedPlace,
  listMySavedPlaces,
  updateMySavedPlace,
} from "../../shared_user_interface_infrastructure/backend_communication/employee_account_api";
import type { SavedPlace } from "../../shared_user_interface_infrastructure/backend_communication/employee_api_types";
import { extractApiErrorMessage } from "../../shared_user_interface_infrastructure/backend_communication/extractApiErrorMessage";

interface SavedPlaceFormState {
  label: string;
  location: SelectedLocation | null;
}

const emptySavedPlaceForm: SavedPlaceFormState = {
  label: "",
  location: null,
};

export function SavedPlacesPage() {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSavedPlace, setEditingSavedPlace] = useState<SavedPlace | null>(
    null,
  );
  const [formState, setFormState] =
    useState<SavedPlaceFormState>(emptySavedPlaceForm);

  const savedPlacesQuery = useQuery({
    queryKey: ["employee-saved-places"],
    queryFn: listMySavedPlaces,
  });

  const savePlaceMutation = useMutation({
    mutationFn: async () => {
      if (!formState.location) {
        throw new Error("Select a location");
      }
      const payload = {
        label: formState.label.trim(),
        address_label: formState.location.label,
        latitude: formState.location.latitude,
        longitude: formState.location.longitude,
      };
      if (editingSavedPlace) {
        return updateMySavedPlace(editingSavedPlace.id, payload);
      }
      return createMySavedPlace(payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["employee-saved-places"],
      });
      toast.success(editingSavedPlace ? "Saved place updated" : "Saved place added");
      closeForm();
    },
    onError: (error) => {
      toast.error(extractApiErrorMessage(error, "Could not save place"));
    },
  });

  const deletePlaceMutation = useMutation({
    mutationFn: deleteMySavedPlace,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["employee-saved-places"],
      });
      toast.success("Saved place deleted");
    },
    onError: (error) => {
      toast.error(extractApiErrorMessage(error, "Could not delete place"));
    },
  });

  function openCreateForm(label = "") {
    setEditingSavedPlace(null);
    setFormState({ label, location: null });
    setIsFormOpen(true);
  }

  function openEditForm(savedPlace: SavedPlace) {
    setEditingSavedPlace(savedPlace);
    setFormState({
      label: savedPlace.label,
      location: {
        latitude: savedPlace.latitude,
        longitude: savedPlace.longitude,
        label: savedPlace.address_label ?? savedPlace.label,
      },
    });
    setIsFormOpen(true);
  }

  function closeForm() {
    setIsFormOpen(false);
    setEditingSavedPlace(null);
    setFormState(emptySavedPlaceForm);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!formState.label.trim()) {
      toast.error("Name this saved place");
      return;
    }
    if (!formState.location) {
      toast.error("Select a location");
      return;
    }
    savePlaceMutation.mutate();
  }

  return (
    <div className="min-h-screen pb-10">
      <EmployeeAppHeader title="Saved Places" leftAction="menu" />

      <div className="px-4 py-4">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">Saved Places</h2>
            <p className="text-xs text-text-muted">
              Keep Home, Office, and frequent stops ready for ride forms.
            </p>
          </div>
          <button
            type="button"
            onClick={() => openCreateForm()}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-raahi-600 text-white"
            aria-label="Add saved place"
          >
            <Plus size={20} />
          </button>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => openCreateForm("Home")}
            className="rounded-xl border border-[color:var(--color-border-primary)] bg-white px-3 py-2 text-sm font-semibold text-raahi-700"
          >
            Add Home
          </button>
          <button
            type="button"
            onClick={() => openCreateForm("Office")}
            className="rounded-xl border border-[color:var(--color-border-primary)] bg-white px-3 py-2 text-sm font-semibold text-raahi-700"
          >
            Add Office
          </button>
        </div>

        {savedPlacesQuery.isLoading ? (
          <EmptyState message="Loading saved places..." />
        ) : savedPlacesQuery.data && savedPlacesQuery.data.length > 0 ? (
          <div className="flex flex-col gap-3">
            {savedPlacesQuery.data.map((savedPlace) => (
              <article
                key={savedPlace.id}
                className="rounded-2xl border border-[color:var(--color-border-primary)] bg-white p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-raahi-50 text-raahi-700">
                    <MapPin size={22} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold">{savedPlace.label}</p>
                    <p className="line-clamp-2 text-sm text-text-secondary">
                      {savedPlace.address_label ?? "Pinned location"}
                    </p>
                    <p className="mt-1 text-[11px] text-text-muted">
                      {savedPlace.latitude.toFixed(5)},{" "}
                      {savedPlace.longitude.toFixed(5)}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => openEditForm(savedPlace)}
                      className="rounded-lg p-2 text-text-secondary hover:bg-surface-secondary"
                      aria-label="Edit saved place"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => deletePlaceMutation.mutate(savedPlace.id)}
                      disabled={deletePlaceMutation.isPending}
                      className="rounded-lg p-2 text-rose-500 hover:bg-rose-50 disabled:opacity-60"
                      aria-label="Delete saved place"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState message="No saved places yet" />
        )}
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex justify-center bg-black/50">
          <div className="mt-auto max-h-[92vh] w-full max-w-[480px] overflow-y-auto rounded-t-3xl bg-white p-4 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-bold">
                {editingSavedPlace ? "Edit Saved Place" : "Add Saved Place"}
              </h3>
              <button type="button" onClick={closeForm} aria-label="Close">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="grid gap-4">
              <label className="grid gap-1 text-xs font-semibold text-text-secondary">
                Place name
                <input
                  value={formState.label}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      label: event.target.value,
                    }))
                  }
                  placeholder="Home, Office, Gym"
                  className="rounded-xl border border-[color:var(--color-border-primary)] bg-white px-3 py-3 text-sm text-text-primary outline-none focus:border-raahi-500"
                />
              </label>
              <LocationSelectorField
                label="Location"
                value={formState.location}
                onChange={(location) =>
                  setFormState((current) => ({ ...current, location }))
                }
                placeholder="Search address"
              />
              <button
                type="submit"
                disabled={savePlaceMutation.isPending}
                className="rounded-xl bg-raahi-600 px-4 py-3 text-sm font-bold text-white disabled:opacity-60"
              >
                {savePlaceMutation.isPending ? "Saving..." : "Save place"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-[color:var(--color-border-secondary)] bg-surface-secondary p-6 text-center text-sm text-text-muted">
      {message}
    </div>
  );
}
