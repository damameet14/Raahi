import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, CheckCircle2 } from 'lucide-react';
import { apiClient } from '@/shared_user_interface_infrastructure/backend_communication/api_client';

interface RegistrationResult {
  organization_name: string;
  administrator_email: string;
  temporary_password: string;
  message: string;
}

export function OrganizationRegistrationPage() {
  const [organizationName, setOrganizationName] = useState('');
  const [industry, setIndustry] = useState('');
  const [address, setAddress] = useState('');
  const [administratorFullName, setAdministratorFullName] = useState('');
  const [administratorEmail, setAdministratorEmail] = useState('');
  const [registrationResult, setRegistrationResult] = useState<RegistrationResult | null>(null);
  const [registrationErrorMessage, setRegistrationErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRegistrationSubmission = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setRegistrationErrorMessage('');

    try {
      const response = await apiClient.post('/api/v1/organizations/register', {
        organization_name: organizationName,
        industry: industry || null,
        address: address || null,
        administrator_full_name: administratorFullName,
        administrator_email: administratorEmail,
      });
      setRegistrationResult(response.data);
    } catch (error: any) {
      setRegistrationErrorMessage(
        error.response?.data?.detail || 'Could not register the organization. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="registration-page">
      <Link className="registration-brand" to="/">
        <span>R</span>
        Raahi
      </Link>

      <main className="registration-shell">
        <section className="registration-introduction">
          <p className="marketing-micro-label">COMPANY ONBOARDING</p>
          <h1>Create your organization.</h1>
          <p>
            Register the company workspace, receive the first admin login,
            then change the temporary password before entering the dashboard.
          </p>
        </section>

        <section className="registration-panel" aria-label="Company registration form">
          {registrationResult ? (
            <div className="registration-success">
              <CheckCircle2 aria-hidden="true" />
              <h2>Admin account created</h2>
              <p>{registrationResult.message}</p>
              <dl>
                <div><dt>Organization</dt><dd>{registrationResult.organization_name}</dd></div>
                <div><dt>Admin email</dt><dd>{registrationResult.administrator_email}</dd></div>
                <div><dt>Temporary password</dt><dd>{registrationResult.temporary_password}</dd></div>
              </dl>
              <Link className="marketing-button marketing-button-primary" to="/login">
                Go to admin login <span>↗</span>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleRegistrationSubmission} className="registration-form">
              <div className="registration-form-heading">
                <Building2 aria-hidden="true" />
                <div>
                  <h2>Organization details</h2>
                  <p>These details create the company tenant and admin account.</p>
                </div>
              </div>

              {registrationErrorMessage && (
                <div className="registration-error">{registrationErrorMessage}</div>
              )}

              <label>
                Company or organization name
                <input value={organizationName} onChange={(event) => setOrganizationName(event.target.value)} required minLength={2} />
              </label>

              <label>
                Industry
                <input value={industry} onChange={(event) => setIndustry(event.target.value)} placeholder="Technology, consulting, education..." />
              </label>

              <label>
                Office address
                <textarea value={address} onChange={(event) => setAddress(event.target.value)} rows={3} />
              </label>

              <div className="registration-two-column">
                <label>
                  Admin full name
                  <input value={administratorFullName} onChange={(event) => setAdministratorFullName(event.target.value)} required minLength={2} />
                </label>
                <label>
                  Admin email
                  <input type="email" value={administratorEmail} onChange={(event) => setAdministratorEmail(event.target.value)} required />
                </label>
              </div>

              <button className="marketing-button marketing-button-primary" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating workspace...' : 'Create organization'} <span>↗</span>
              </button>
            </form>
          )}
        </section>
      </main>
    </div>
  );
}
