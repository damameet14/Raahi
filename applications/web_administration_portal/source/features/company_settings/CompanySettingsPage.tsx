/**
 * Company settings page with form for organizational configuration.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { apiClient } from '@/shared_user_interface_infrastructure/backend_communication/api_client';
import { PageHeader } from '@/shared_user_interface_infrastructure/reusable_components/PageHeader';
import { LoadingSpinner } from '@/shared_user_interface_infrastructure/reusable_components/LoadingSpinner';
import toast from 'react-hot-toast';

const companySettingsSchema = z.object({
  fuel_cost_per_liter: z.coerce.number().min(0),
  travel_cost_per_kilometer: z.coerce.number().min(0),
  office_latitude: z.coerce.number(),
  office_longitude: z.coerce.number(),
  ride_radius_kilometers: z.coerce.number().min(1),
  default_currency: z.string().min(1),
  company_logo_url: z.string().optional(),
});

type CompanySettingsFormData = z.infer<typeof companySettingsSchema>;

export function CompanySettingsPage() {
  const queryClient = useQueryClient();

  const settingsQuery = useQuery({
    queryKey: ['company-settings'],
    queryFn: async () => {
      const response = await apiClient.get('/api/v1/settings');
      return response.data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: CompanySettingsFormData) => apiClient.put('/api/v1/settings', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-settings'] });
      toast.success('Settings saved successfully');
    },
    onError: () => toast.error('Failed to save settings'),
  });

  const { register, handleSubmit, formState: { errors, isDirty } } = useForm<CompanySettingsFormData>({
    resolver: zodResolver(companySettingsSchema),
    values: settingsQuery.data,
  });

  if (settingsQuery.isLoading) return <LoadingSpinner message="Loading settings..." />;

  return (
    <div className="animate-fade-in">
      <PageHeader title="Company Settings" description="Configure your organization's carpooling parameters" />

      <form onSubmit={handleSubmit((data) => updateMutation.mutate(data))} className="max-w-2xl space-y-8">
        {/* ── Cost Configuration ───────────────────────── */}
        <div className="glass-card p-6">
          <h3 className="mb-4 text-base font-semibold text-text-primary">Cost Configuration</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary">Fuel Cost per Liter (₹)</label>
              <input {...register('fuel_cost_per_liter')} type="number" step="0.01" className="w-full rounded-xl border border-border-primary bg-surface-primary px-4 py-2.5 text-sm text-text-primary outline-none focus:border-raahi-500" />
              {errors.fuel_cost_per_liter && <p className="mt-1 text-xs text-rose-400">{errors.fuel_cost_per_liter.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary">Travel Cost per KM (₹)</label>
              <input {...register('travel_cost_per_kilometer')} type="number" step="0.01" className="w-full rounded-xl border border-border-primary bg-surface-primary px-4 py-2.5 text-sm text-text-primary outline-none focus:border-raahi-500" />
              {errors.travel_cost_per_kilometer && <p className="mt-1 text-xs text-rose-400">{errors.travel_cost_per_kilometer.message}</p>}
            </div>
          </div>
          <div className="mt-4">
            <label className="mb-1 block text-xs font-medium text-text-secondary">Default Currency</label>
            <select {...register('default_currency')} className="w-full rounded-xl border border-border-primary bg-surface-primary px-4 py-2.5 text-sm text-text-primary outline-none focus:border-raahi-500">
              <option value="INR">INR (₹)</option>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
            </select>
          </div>
        </div>

        {/* ── Office Location ──────────────────────────── */}
        <div className="glass-card p-6">
          <h3 className="mb-4 text-base font-semibold text-text-primary">Office Location</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary">Office Latitude</label>
              <input {...register('office_latitude')} type="number" step="0.0001" className="w-full rounded-xl border border-border-primary bg-surface-primary px-4 py-2.5 text-sm text-text-primary outline-none focus:border-raahi-500" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary">Office Longitude</label>
              <input {...register('office_longitude')} type="number" step="0.0001" className="w-full rounded-xl border border-border-primary bg-surface-primary px-4 py-2.5 text-sm text-text-primary outline-none focus:border-raahi-500" />
            </div>
          </div>
          <div className="mt-4">
            <label className="mb-1 block text-xs font-medium text-text-secondary">Ride Radius (km)</label>
            <input {...register('ride_radius_kilometers')} type="number" step="0.1" className="w-full rounded-xl border border-border-primary bg-surface-primary px-4 py-2.5 text-sm text-text-primary outline-none focus:border-raahi-500" />
          </div>
        </div>

        {/* ── Branding ─────────────────────────────────── */}
        <div className="glass-card p-6">
          <h3 className="mb-4 text-base font-semibold text-text-primary">Branding</h3>
          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary">Company Logo URL</label>
            <input {...register('company_logo_url')} placeholder="https://..." className="w-full rounded-xl border border-border-primary bg-surface-primary px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-raahi-500" />
          </div>
        </div>

        <button
          type="submit"
          disabled={!isDirty || updateMutation.isPending}
          className="rounded-xl bg-raahi-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-raahi-600/25 transition-all hover:bg-raahi-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {updateMutation.isPending ? 'Saving...' : 'Save Settings'}
        </button>
      </form>
    </div>
  );
}
