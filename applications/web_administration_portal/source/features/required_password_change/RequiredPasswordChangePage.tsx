import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound } from 'lucide-react';
import { apiClient } from '@/shared_user_interface_infrastructure/backend_communication/api_client';
import { useAuthenticatedUser } from '@/shared_user_interface_infrastructure/authentication_state/AuthenticationContextProvider';

export function RequiredPasswordChangePage() {
  const navigate = useNavigate();
  const { markPasswordChangeCompleted } = useAuthenticatedUser();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePasswordChangeSubmission = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      await apiClient.post('/api/v1/authentication/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
      });
      markPasswordChangeCompleted();
      navigate('/dashboard');
    } catch (error: any) {
      setErrorMessage(error.response?.data?.detail || 'Could not change password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="registration-page">
      <main className="password-change-panel">
        <div className="registration-form-heading">
          <KeyRound aria-hidden="true" />
          <div>
            <h1>Change temporary password</h1>
            <p>Your organization admin account must set a new password before opening the dashboard.</p>
          </div>
        </div>

        <form onSubmit={handlePasswordChangeSubmission} className="registration-form">
          {errorMessage && <div className="registration-error">{errorMessage}</div>}
          <label>
            Temporary password
            <input type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} required />
          </label>
          <label>
            New password
            <input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required minLength={8} />
          </label>
          <button className="marketing-button marketing-button-primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving password...' : 'Save new password'} <span>↗</span>
          </button>
        </form>
      </main>
    </div>
  );
}
