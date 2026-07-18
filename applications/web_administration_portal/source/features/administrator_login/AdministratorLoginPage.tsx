/**
 * Administrator login page with branded UI.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, LogIn, Eye, EyeOff } from 'lucide-react';
import { apiClient } from '@/shared_user_interface_infrastructure/backend_communication/api_client';
import { useAuthenticatedUser } from '@/shared_user_interface_infrastructure/authentication_state/AuthenticationContextProvider';

export function AdministratorLoginPage() {
  const navigate = useNavigate();
  const { storeAuthenticationTokens } = useAuthenticatedUser();

  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authenticationErrorMessage, setAuthenticationErrorMessage] = useState('');

  const handleLoginFormSubmission = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setAuthenticationErrorMessage('');

    try {
      const response = await apiClient.post('/api/v1/authentication/login', {
        email: emailAddress,
        password: password,
      });

      const {
        access_token,
        refresh_token,
        user_account_id,
        email,
        full_name,
        role,
        organization_id,
      } = response.data;

      storeAuthenticationTokens(access_token, refresh_token, {
        userAccountId: user_account_id,
        email,
        fullName: full_name,
        role,
        organizationId: organization_id,
      });

      navigate('/dashboard');
    } catch (error: any) {
      setAuthenticationErrorMessage(
        error.response?.data?.detail || 'Authentication failed. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* ── Left panel: branded visual ───────────────── */}
      <div className="hidden lg:flex lg:w-1/2 gradient-raahi items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative z-10 max-w-md text-center px-8">
          <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
            <Building2 className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-4xl font-bold text-white mb-4">Raahi</h2>
          <p className="text-lg text-white/80 leading-relaxed">
            Enterprise Carpooling Platform — Reducing carbon footprint one shared ride at a time.
          </p>
          <div className="mt-12 grid grid-cols-3 gap-6 text-center">
            <div>
              <p className="text-3xl font-bold text-white">40%</p>
              <p className="text-xs text-white/60 mt-1">Fuel Saved</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-white">2.3t</p>
              <p className="text-xs text-white/60 mt-1">CO₂ Reduced</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-white">500+</p>
              <p className="text-xs text-white/60 mt-1">Rides Shared</p>
            </div>
          </div>
        </div>
        {/* Decorative circles */}
        <div className="absolute -bottom-32 -left-32 h-64 w-64 rounded-full bg-white/5" />
        <div className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-white/5" />
      </div>

      {/* ── Right panel: login form ──────────────────── */}
      <div className="flex w-full items-center justify-center bg-surface-primary px-6 lg:w-1/2">
        <div className="w-full max-w-md animate-fade-in">
          <div className="mb-8">
            <div className="lg:hidden mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-raahi">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-text-primary">Raahi</span>
            </div>
            <h1 className="text-2xl font-bold text-text-primary">Welcome back</h1>
            <p className="mt-2 text-sm text-text-secondary">
              Sign in to your admin portal to manage your organization.
            </p>
          </div>

          <form onSubmit={handleLoginFormSubmission} className="space-y-5">
            {authenticationErrorMessage && (
              <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
                {authenticationErrorMessage}
              </div>
            )}

            <div>
              <label htmlFor="email-input" className="mb-1.5 block text-sm font-medium text-text-secondary">
                Email Address
              </label>
              <input
                id="email-input"
                type="email"
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                placeholder="admin@raahi.com"
                required
                className="w-full rounded-xl border border-border-primary bg-surface-secondary px-4 py-3 text-sm text-text-primary placeholder:text-text-muted outline-none transition-colors focus:border-raahi-500 focus:ring-1 focus:ring-raahi-500/30"
              />
            </div>

            <div>
              <label htmlFor="password-input" className="mb-1.5 block text-sm font-medium text-text-secondary">
                Password
              </label>
              <div className="relative">
                <input
                  id="password-input"
                  type={isPasswordVisible ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full rounded-xl border border-border-primary bg-surface-secondary px-4 py-3 pr-11 text-sm text-text-primary placeholder:text-text-muted outline-none transition-colors focus:border-raahi-500 focus:ring-1 focus:ring-raahi-500/30"
                />
                <button
                  type="button"
                  onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
                >
                  {isPasswordVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-raahi-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-raahi-600/25 transition-all hover:bg-raahi-700 hover:shadow-raahi-600/40 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98]"
            >
              {isSubmitting ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  Sign In
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-text-muted">
            Demo credentials: admin@raahi.com / admin123
          </p>
        </div>
      </div>
    </div>
  );
}
