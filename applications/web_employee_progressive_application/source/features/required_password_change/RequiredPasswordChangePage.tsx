/**
 * Forced first-login password change. An admin-provisioned employee must
 * replace their temporary password here before using the app.
 */

import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import { changeEmployeePassword } from "../../shared_user_interface_infrastructure/backend_communication/employee_account_api";
import { useEmployeeAuthentication } from "../../shared_user_interface_infrastructure/authentication_state/EmployeeAuthenticationContext";
import { PrimaryButton } from "../../shared_user_interface_infrastructure/reusable_components/PrimaryButton";
import { PasswordField } from "../../shared_user_interface_infrastructure/reusable_components/PasswordField";
import { extractApiErrorMessage } from "../../shared_user_interface_infrastructure/backend_communication/extractApiErrorMessage";

export function RequiredPasswordChangePage() {
  const navigate = useNavigate();
  const { markPasswordChanged } = useEmployeeAuthentication();
  const [temporaryPassword, setTemporaryPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setIsSubmitting(true);
    try {
      await changeEmployeePassword(temporaryPassword, newPassword);
      markPasswordChanged();
      toast.success("Password updated");
      navigate("/onboarding", { replace: true });
    } catch (error) {
      toast.error(extractApiErrorMessage(error, "Could not change password"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col justify-center px-6 py-10">
      <h1 className="text-2xl font-extrabold tracking-tight">
        Set a new password
      </h1>
      <p className="mb-6 mt-1 text-sm text-text-secondary">
        For your security, choose a new password to replace the temporary one.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <PasswordField
          label="Temporary password"
          value={temporaryPassword}
          onChange={setTemporaryPassword}
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
        <PrimaryButton type="submit" isLoading={isSubmitting} className="mt-2">
          Update password
        </PrimaryButton>
      </form>
    </div>
  );
}
