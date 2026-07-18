/**
 * My Profile: the employee's basic details (read-only), their saved home
 * and office addresses (editable), and a password-change form.
 */

import { useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { EmployeeAppHeader } from "../../shared_user_interface_infrastructure/layout/EmployeeAppHeader";
import {
  EMPLOYEE_PROFILE_QUERY_KEY,
  useEmployeeProfileQuery,
} from "../../shared_user_interface_infrastructure/employee_profile/useEmployeeProfileQuery";
import { LocationSelectorField } from "../../shared_user_interface_infrastructure/maps/LocationSelectorField";
import type { SelectedLocation } from "../../shared_user_interface_infrastructure/maps/types/selectedLocation";
import { PrimaryButton } from "../../shared_user_interface_infrastructure/reusable_components/PrimaryButton";
import { PasswordField } from "../../shared_user_interface_infrastructure/reusable_components/PasswordField";
import {
  changeEmployeePassword,
  updateMyAddresses,
} from "../../shared_user_interface_infrastructure/backend_communication/employee_account_api";
import { extractApiErrorMessage } from "../../shared_user_interface_infrastructure/backend_communication/extractApiErrorMessage";

export function ProfileManagementPage() {
  const queryClient = useQueryClient();
  const profileQuery = useEmployeeProfileQuery();
  const profile = profileQuery.data;

  const [homeLocation, setHomeLocation] = useState<SelectedLocation | null>(null);
  const [officeLocation, setOfficeLocation] = useState<SelectedLocation | null>(
    null,
  );
  const [isSavingAddresses, setIsSavingAddresses] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Prefill from the saved profile once it loads, same pattern used by the
  // onboarding and Find/Offer Ride screens.
  if (profile && homeLocation === null && profile.home_latitude != null) {
    setHomeLocation({
      latitude: profile.home_latitude,
      longitude: profile.home_longitude as number,
      label: profile.home_address_label ?? "Home",
    });
  }
  if (profile && officeLocation === null && profile.office_latitude != null) {
    setOfficeLocation({
      latitude: profile.office_latitude,
      longitude: profile.office_longitude as number,
      label: profile.office_address_label ?? "Office",
    });
  }

  async function handleSaveAddresses(event: FormEvent) {
    event.preventDefault();
    if (!homeLocation || !officeLocation) {
      toast.error("Select both your home and office addresses");
      return;
    }
    setIsSavingAddresses(true);
    try {
      await updateMyAddresses({
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
      toast.success("Addresses updated");
    } catch (error) {
      toast.error(
        extractApiErrorMessage(error, "Could not update your addresses"),
      );
    } finally {
      setIsSavingAddresses(false);
    }
  }

  async function handleChangePassword(event: FormEvent) {
    event.preventDefault();
    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setIsChangingPassword(true);
    try {
      await changeEmployeePassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Password updated");
    } catch (error) {
      toast.error(extractApiErrorMessage(error, "Could not change password"));
    } finally {
      setIsChangingPassword(false);
    }
  }

  return (
    <div className="min-h-screen pb-10">
      <EmployeeAppHeader title="My Profile" />

      <div className="flex flex-col gap-6 px-4 py-4">
        <section className="rounded-2xl border border-[color:var(--color-border-primary)] p-4">
          <p className="text-sm font-semibold">{profile?.full_name}</p>
          <p className="text-xs text-text-muted">
            {profile?.employee_code} · {profile?.department} ·{" "}
            {profile?.designation}
          </p>
          <p className="mt-1 text-xs text-text-muted">{profile?.email}</p>
        </section>

        <form onSubmit={handleSaveAddresses} className="flex flex-col gap-4">
          <h2 className="text-sm font-bold uppercase tracking-wide text-text-secondary">
            Addresses
          </h2>
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
          <PrimaryButton type="submit" isLoading={isSavingAddresses}>
            Save addresses
          </PrimaryButton>
        </form>

        <form
          onSubmit={handleChangePassword}
          className="flex flex-col gap-4 border-t border-[color:var(--color-border-primary)] pt-6"
        >
          <h2 className="text-sm font-bold uppercase tracking-wide text-text-secondary">
            Change password
          </h2>
          <PasswordField
            label="Current password"
            value={currentPassword}
            onChange={setCurrentPassword}
            autoComplete="current-password"
          />
          <PasswordField
            label="New password"
            value={newPassword}
            onChange={setNewPassword}
            autoComplete="new-password"
          />
          <PasswordField
            label="Confirm new password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            autoComplete="new-password"
          />
          <PrimaryButton
            type="submit"
            variant="secondary"
            isLoading={isChangingPassword}
          >
            Update password
          </PrimaryButton>
        </form>
      </div>
    </div>
  );
}
