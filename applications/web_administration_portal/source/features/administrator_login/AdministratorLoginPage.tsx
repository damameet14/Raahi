/**
 * Administrator login page with the public Raahi visual system.
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { apiClient } from '@/shared_user_interface_infrastructure/backend_communication/api_client';
import { useAuthenticatedUser } from '@/shared_user_interface_infrastructure/authentication_state/AuthenticationContextProvider';
import { RaahiBrandLockup } from '@/shared_user_interface_infrastructure/branding/RaahiBrandLockup';

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
        must_change_password,
      } = response.data;

      storeAuthenticationTokens(access_token, refresh_token, {
        userAccountId: user_account_id,
        email,
        fullName: full_name,
        role,
        organizationId: organization_id,
        mustChangePassword: must_change_password,
      });

      const postLoginPath = must_change_password
        ? '/change-password'
        : role === 'SUPER_ADMIN'
          ? '/platform/onboarding'
          : '/dashboard';
      navigate(postLoginPath);
    } catch (error: any) {
      setAuthenticationErrorMessage(
        error.response?.data?.detail || 'Authentication failed. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="registration-page">
      <Link className="registration-brand" to="/">
        <RaahiBrandLockup />
      </Link>

      <main className="administrator-login-shell">
        <section className="registration-introduction">
          <p className="marketing-micro-label">ADMIN PORTAL</p>
          <h1>Welcome back.</h1>
          <p>
            Sign in to manage your organization, employees, vehicles, reports,
            and company commute settings.
          </p>
          <div className="administrator-login-statistics" aria-label="Raahi platform statistics">
            <div><strong>40%</strong><span>Fuel Saved</span></div>
            <div><strong>2.3t</strong><span>CO2 Reduced</span></div>
            <div><strong>500+</strong><span>Rides Shared</span></div>
          </div>
        </section>

        <section className="registration-panel" aria-label="Administrator login form">
          <div className="registration-form-heading">
            <LogIn aria-hidden="true" />
            <div>
              <h2>Admin login</h2>
              <p>Sign in to your admin portal to manage your organization.</p>
            </div>
          </div>

          <form onSubmit={handleLoginFormSubmission} className="registration-form">
            {authenticationErrorMessage && (
              <div className="registration-error">
                {authenticationErrorMessage}
              </div>
            )}

            <label htmlFor="email-input">
              Email Address
              <input
                id="email-input"
                type="email"
                value={emailAddress}
                onChange={(event) => setEmailAddress(event.target.value)}
                placeholder="admin@raahi.com"
                required
              />
            </label>

            <label htmlFor="password-input">
              Password
              <div className="administrator-password-input">
                <input
                  id="password-input"
                  type={isPasswordVisible ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                  aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
                >
                  {isPasswordVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </label>

            <button
              type="submit"
              disabled={isSubmitting}
              className="marketing-button marketing-button-primary administrator-login-button"
            >
              {isSubmitting ? (
                'Signing in...'
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  Sign In
                </>
              )}
            </button>
          </form>

          <p className="administrator-demo-credentials">
            Demo — Company admin: admin@sabarmati.tech / admin123 · Super-admin:
            superadmin@raahi.d14.app / raahi-super-123
          </p>
        </section>
      </main>
    </div>
  );
}
