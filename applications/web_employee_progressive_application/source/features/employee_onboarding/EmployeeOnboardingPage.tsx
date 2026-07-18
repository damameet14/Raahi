/**
 * First-login onboarding. Captures the mandatory vehicle question (with
 * details when the employee drives) and home + office locations via Google
 * Maps, then marks onboarding complete and enters the app.
 */

import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { submitOnboarding } from "../../shared_user_interface_infrastructure/backend_communication/employee_account_api";
import {
  EMPLOYEE_PROFILE_QUERY_KEY,
  useEmployeeProfileQuery,
} from "../../shared_user_interface_infrastructure/employee_profile/useEmployeeProfileQuery";
import { LocationSelectorField } from "../../shared_user_interface_infrastructure/maps/LocationSelectorField";
import type { SelectedLocation } from "../../shared_user_interface_infrastructure/maps/types/selectedLocation";
import { PrimaryButton } from "../../shared_user_interface_infrastructure/reusable_components/PrimaryButton";
import { extractApiErrorMessage } from "../../shared_user_interface_infrastructure/backend_communication/extractApiErrorMessage";

export function EmployeeOnboardingPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const profileQuery = useEmployeeProfileQuery();

  const [hasVehicle, setHasVehicle] = useState(false);
  const [makeAndModel, setMakeAndModel] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [maximumPassengers, setMaximumPassengers] = useState(3);
  const [homeLocation, setHomeLocation] = useState<SelectedLocation | null>(null);
  const [officeLocation, setOfficeLocation] = useState<SelectedLocation | null>(
    null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (profileQuery.data?.onboarding_completed) {
      navigate("/home", { replace: true });
    }
  }, [profileQuery.data, navigate]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!homeLocation || !officeLocation) {
      toast.error("Please select both your home and office locations");
      return;
    }
    if (hasVehicle && (!makeAndModel.trim() || !vehicleNumber.trim())) {
      toast.error("Please complete your vehicle details");
      return;
    }
    setIsSubmitting(true);
    try {
      await submitOnboarding({
        has_vehicle: hasVehicle,
        vehicle: hasVehicle
          ? {
              make_and_model: makeAndModel.trim(),
              vehicle_number: vehicleNumber.trim(),
              maximum_passengers: maximumPassengers,
            }
          : null,
        home_latitude: homeLocation.latitude,
        home_longitude: homeLocation.longitude,
        home_address_label: homeLocation.label,
        office_latitude: officeLocation.latitude,
        office_longitude: officeLocation.longitude,
        office_address_label: officeLocation.label,
      });
      await queryClient.invalidateQueries({
        queryKey: EMPLOYEE_PROFILE_QUERY_KEY,
      });
      toast.success("You're all set!");
      navigate("/home", { replace: true });
    } catch (error) {
      toast.error(extractApiErrorMessage(error, "Could not save your details"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen px-6 py-8">
      <h1 className="text-2xl font-extrabold tracking-tight">
        Set up your profile
      </h1>
      <p className="mb-6 mt-1 text-sm text-text-secondary">
        A few details so we can match you with the right rides.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <section>
          <p className="mb-2 text-sm font-semibold">Do you have a vehicle?</p>
          <div className="grid grid-cols-2 gap-3">
            <VehicleChoiceButton
              label="Yes, I drive"
              isSelected={hasVehicle}
              onClick={() => setHasVehicle(true)}
            />
            <VehicleChoiceButton
              label="No, I ride"
              isSelected={!hasVehicle}
              onClick={() => setHasVehicle(false)}
            />
          </div>
        </section>

        {hasVehicle && (
          <section className="flex flex-col gap-3 rounded-2xl bg-surface-secondary p-4">
            <label className="flex flex-col gap-1 text-xs font-semibold text-text-secondary">
              Make and model
              <input
                value={makeAndModel}
                onChange={(event) => setMakeAndModel(event.target.value)}
                placeholder="e.g. Maruti Swift Dzire"
                className="rounded-xl border border-[color:var(--color-border-primary)] bg-white px-3 py-3 text-sm outline-none focus:border-raahi-500"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-semibold text-text-secondary">
              Vehicle number
              <input
                value={vehicleNumber}
                onChange={(event) =>
                  setVehicleNumber(event.target.value.toUpperCase())
                }
                placeholder="e.g. DL-01-CD-5678"
                className="rounded-xl border border-[color:var(--color-border-primary)] bg-white px-3 py-3 text-sm outline-none focus:border-raahi-500"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-semibold text-text-secondary">
              Maximum passengers
              <input
                type="number"
                min={1}
                max={20}
                value={maximumPassengers}
                onChange={(event) =>
                  setMaximumPassengers(Number(event.target.value))
                }
                className="rounded-xl border border-[color:var(--color-border-primary)] bg-white px-3 py-3 text-sm outline-none focus:border-raahi-500"
              />
            </label>
          </section>
        )}

        <LocationSelectorField
          label="Home address"
          value={homeLocation}
          onChange={setHomeLocation}
          placeholder="Search your home address"
        />
        <LocationSelectorField
          label="Office address"
          value={officeLocation}
          onChange={setOfficeLocation}
          placeholder="Search your office address"
        />

        <PrimaryButton type="submit" isLoading={isSubmitting}>
          Continue
        </PrimaryButton>
      </form>
    </div>
  );
}

function VehicleChoiceButton({
  label,
  isSelected,
  onClick,
}: {
  label: string;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${
        isSelected
          ? "border-raahi-500 bg-raahi-50 text-raahi-700"
          : "border-[color:var(--color-border-primary)] bg-white text-text-secondary"
      }`}
    >
      {label}
    </button>
  );
}
