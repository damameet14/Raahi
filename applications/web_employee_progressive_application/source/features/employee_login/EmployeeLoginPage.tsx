/** Employee login. Reuses the shared /authentication/login endpoint. */

import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Eye, EyeOff } from "lucide-react";

import { loginEmployee } from "../../shared_user_interface_infrastructure/backend_communication/employee_account_api";
import { useEmployeeAuthentication } from "../../shared_user_interface_infrastructure/authentication_state/EmployeeAuthenticationContext";
import { PrimaryButton } from "../../shared_user_interface_infrastructure/reusable_components/PrimaryButton";
import { extractApiErrorMessage } from "../../shared_user_interface_infrastructure/backend_communication/extractApiErrorMessage";

export function EmployeeLoginPage() {
  const navigate = useNavigate();
  const { storeSession } = useEmployeeAuthentication();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      const tokens = await loginEmployee(email.trim(), password);
      storeSession(tokens);
      if (tokens.must_change_password) {
        navigate("/change-password", { replace: true });
      } else {
        navigate("/home", { replace: true });
      }
    } catch (error) {
      toast.error(extractApiErrorMessage(error, "Invalid email or password"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col justify-center px-6 py-10">
      <div className="mb-8">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-raahi-600 text-2xl font-black text-white">
          R
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight">Welcome back</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Sign in with the credentials your administrator gave you.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-xs font-semibold text-text-secondary">
          Work email
          <input
            type="email"
            required
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="rounded-xl border border-[color:var(--color-border-primary)] bg-white px-3 py-3 text-sm text-text-primary outline-none focus:border-raahi-500"
            placeholder="you@company.com"
          />
        </label>

        <label className="flex flex-col gap-1 text-xs font-semibold text-text-secondary">
          Password
          <div className="relative">
            <input
              type={isPasswordVisible ? "text" : "password"}
              required
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl border border-[color:var(--color-border-primary)] bg-white px-3 py-3 pr-11 text-sm text-text-primary outline-none focus:border-raahi-500"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setIsPasswordVisible((current) => !current)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary"
              aria-label={isPasswordVisible ? "Hide password" : "Show password"}
            >
              {isPasswordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </label>

        <PrimaryButton type="submit" isLoading={isSubmitting} className="mt-2">
          Sign in
        </PrimaryButton>
      </form>
    </div>
  );
}
