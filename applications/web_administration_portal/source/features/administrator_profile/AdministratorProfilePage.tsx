/**
 * Administrator profile page with profile edit and password change.
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Shield, KeyRound } from 'lucide-react';
import { apiClient } from '@/shared_user_interface_infrastructure/backend_communication/api_client';
import { PageHeader } from '@/shared_user_interface_infrastructure/reusable_components/PageHeader';
import { LoadingSpinner } from '@/shared_user_interface_infrastructure/reusable_components/LoadingSpinner';
import toast from 'react-hot-toast';

const profileSchema = z.object({
  full_name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required'),
});

const changePasswordSchema = z.object({
  current_password: z.string().min(1, 'Current password is required'),
  new_password: z.string().min(6, 'Minimum 6 characters'),
  confirm_password: z.string().min(1, 'Please confirm'),
}).refine((data) => data.new_password === data.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password'],
});

export function AdministratorProfilePage() {
  const queryClient = useQueryClient();
  const [showPasswordSection, setShowPasswordSection] = useState(false);

  const profileQuery = useQuery({
    queryKey: ['admin-profile'],
    queryFn: async () => {
      const response = await apiClient.get('/api/v1/profile');
      return response.data;
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data: { full_name: string; email: string }) => apiClient.put('/api/v1/profile', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-profile'] });
      toast.success('Profile updated');
    },
    onError: () => toast.error('Failed to update profile'),
  });

  const changePasswordMutation = useMutation({
    mutationFn: (data: { current_password: string; new_password: string }) => apiClient.post('/api/v1/profile/change-password', data),
    onSuccess: () => {
      toast.success('Password changed successfully');
      resetPasswordForm();
      setShowPasswordSection(false);
    },
    onError: (error: any) => toast.error(error.response?.data?.detail || 'Failed to change password'),
  });

  const { register: registerProfile, handleSubmit: handleProfileSubmit, formState: { errors: profileErrors, isDirty } } = useForm({
    resolver: zodResolver(profileSchema),
    values: profileQuery.data,
  });

  const { register: registerPassword, handleSubmit: handlePasswordSubmit, formState: { errors: passwordErrors }, reset: resetPasswordForm } = useForm({
    resolver: zodResolver(changePasswordSchema),
  });

  if (profileQuery.isLoading) return <LoadingSpinner message="Loading profile..." />;

  return (
    <div className="animate-fade-in">
      <PageHeader title="Profile" description="Manage your administrator profile" />

      <div className="max-w-2xl space-y-6">
        {/* ── Profile card ────────────────────────────── */}
        <div className="glass-card p-6">
          <div className="mb-6 flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl gradient-raahi text-2xl font-bold text-white">
              {profileQuery.data?.full_name?.charAt(0) || 'A'}
            </div>
            <div>
              <h2 className="text-xl font-bold text-text-primary">{profileQuery.data?.full_name}</h2>
              <div className="mt-1 flex items-center gap-2">
                <Shield className="h-4 w-4 text-raahi-400" />
                <span className="text-sm text-raahi-400">{profileQuery.data?.role}</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleProfileSubmit((data) => updateProfileMutation.mutate(data))} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary">Full Name</label>
              <input {...registerProfile('full_name')} className="w-full rounded-xl border border-border-primary bg-surface-primary px-4 py-2.5 text-sm text-text-primary outline-none focus:border-raahi-500" />
              {profileErrors.full_name?.message && <p className="mt-1 text-xs text-rose-400">{String(profileErrors.full_name.message)}</p>}
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary">Email Address</label>
              <input {...registerProfile('email')} className="w-full rounded-xl border border-border-primary bg-surface-primary px-4 py-2.5 text-sm text-text-primary outline-none focus:border-raahi-500" />
              {profileErrors.email?.message && <p className="mt-1 text-xs text-rose-400">{String(profileErrors.email.message)}</p>}
            </div>
            <button type="submit" disabled={!isDirty || updateProfileMutation.isPending} className="rounded-xl bg-raahi-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-raahi-700 disabled:opacity-50">
              {updateProfileMutation.isPending ? 'Saving...' : 'Save Profile'}
            </button>
          </form>
        </div>

        {/* ── Password section ────────────────────────── */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-text-secondary" />
              <h3 className="text-base font-semibold text-text-primary">Change Password</h3>
            </div>
            <button onClick={() => setShowPasswordSection(!showPasswordSection)} className="text-sm font-medium text-raahi-400 hover:text-raahi-300">
              {showPasswordSection ? 'Cancel' : 'Change'}
            </button>
          </div>

          {showPasswordSection && (
            <form onSubmit={handlePasswordSubmit((data) => changePasswordMutation.mutate(data))} className="space-y-4 animate-fade-in">
              <div>
                <label className="mb-1 block text-xs font-medium text-text-secondary">Current Password</label>
                <input {...registerPassword('current_password')} type="password" className="w-full rounded-xl border border-border-primary bg-surface-primary px-4 py-2.5 text-sm text-text-primary outline-none focus:border-raahi-500" />
                {passwordErrors.current_password && <p className="mt-1 text-xs text-rose-400">{passwordErrors.current_password.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-text-secondary">New Password</label>
                  <input {...registerPassword('new_password')} type="password" className="w-full rounded-xl border border-border-primary bg-surface-primary px-4 py-2.5 text-sm text-text-primary outline-none focus:border-raahi-500" />
                  {passwordErrors.new_password && <p className="mt-1 text-xs text-rose-400">{passwordErrors.new_password.message}</p>}
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-text-secondary">Confirm Password</label>
                  <input {...registerPassword('confirm_password')} type="password" className="w-full rounded-xl border border-border-primary bg-surface-primary px-4 py-2.5 text-sm text-text-primary outline-none focus:border-raahi-500" />
                  {passwordErrors.confirm_password && <p className="mt-1 text-xs text-rose-400">{passwordErrors.confirm_password.message}</p>}
                </div>
              </div>
              <button type="submit" disabled={changePasswordMutation.isPending} className="rounded-xl bg-raahi-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-raahi-700 disabled:opacity-50">
                {changePasswordMutation.isPending ? 'Changing...' : 'Change Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
