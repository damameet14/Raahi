/**
 * Vehicle list page with search, filters, and CRUD actions.
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Trash2, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { apiClient } from '@/shared_user_interface_infrastructure/backend_communication/api_client';
import { DataTable } from '@/shared_user_interface_infrastructure/reusable_components/DataTable';
import { PageHeader } from '@/shared_user_interface_infrastructure/reusable_components/PageHeader';
import toast from 'react-hot-toast';

interface VehicleData {
  id: string;
  vehicle_number: string;
  owner_employee_id: string;
  make: string;
  model: string;
  year: number | null;
  capacity: number;
  fuel_type: string;
  status: string;
  insurance_expiry_date: string | null;
}

interface EmployeeOption { id: string; full_name: string; employee_code: string; }

const createVehicleSchema = z.object({
  vehicle_number: z.string().min(1, 'Vehicle number is required'),
  owner_employee_id: z.string().min(1, 'Owner is required'),
  make: z.string().min(1, 'Make is required'),
  model: z.string().min(1, 'Model is required'),
  year: z.coerce.number().optional(),
  color: z.string().optional(),
  capacity: z.coerce.number().min(1).default(4),
  fuel_type: z.string().default('PETROL'),
  insurance_expiry_date: z.string().optional(),
});

type CreateVehicleFormData = z.input<typeof createVehicleSchema>;

export function VehicleListPage() {
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchText, setSearchText] = useState('');
  const [isCreationModalOpen, setIsCreationModalOpen] = useState(false);

  const vehicleListQuery = useQuery({
    queryKey: ['vehicles', currentPage, searchText],
    queryFn: async () => {
      const params = new URLSearchParams({ page: currentPage.toString(), page_size: '15', search_query: searchText });
      const response = await apiClient.get(`/api/v1/vehicles?${params}`);
      return response.data;
    },
  });

  const employeeOptionsQuery = useQuery({
    queryKey: ['employee-options'],
    queryFn: async () => {
      const response = await apiClient.get('/api/v1/employees?page_size=100');
      return response.data.items as EmployeeOption[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (vehicleId: string) => apiClient.delete(`/api/v1/vehicles/${vehicleId}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['vehicles'] }); toast.success('Vehicle deleted'); },
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateVehicleFormData) => {
      const payload = {
        ...data,
        capacity: data.capacity ?? 4,
        fuel_type: data.fuel_type ?? 'PETROL',
        insurance_expiry_date: data.insurance_expiry_date || null,
      };
      return apiClient.post('/api/v1/vehicles', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      setIsCreationModalOpen(false);
      toast.success('Vehicle registered');
    },
    onError: () => toast.error('Failed to register vehicle'),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateVehicleFormData>({
    resolver: zodResolver(createVehicleSchema),
  });

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      ACTIVE: 'bg-emerald-500/15 text-emerald-400',
      MAINTENANCE: 'bg-amber-500/15 text-amber-400',
      INACTIVE: 'bg-rose-500/15 text-rose-400',
    };
    return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${colors[status] || 'bg-surface-tertiary text-text-secondary'}`}>{status}</span>;
  };

  const fuelBadge = (fuelType: string) => {
    const colors: Record<string, string> = {
      PETROL: 'bg-amber-500/15 text-amber-400',
      DIESEL: 'bg-surface-tertiary text-text-secondary',
      ELECTRIC: 'bg-emerald-500/15 text-emerald-400',
      CNG: 'bg-cyan-500/15 text-cyan-400',
    };
    return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${colors[fuelType] || 'bg-surface-tertiary text-text-secondary'}`}>{fuelType}</span>;
  };

  const columns = [
    { headerLabel: 'Vehicle No.', accessorKey: 'vehicle_number' as const },
    { headerLabel: 'Make', accessorKey: 'make' as const },
    { headerLabel: 'Model', accessorKey: 'model' as const },
    { headerLabel: 'Capacity', accessorKey: 'capacity' as const, className: 'w-24 text-center' },
    { headerLabel: 'Fuel Type', renderCell: (row: VehicleData) => fuelBadge(row.fuel_type) },
    { headerLabel: 'Status', renderCell: (row: VehicleData) => statusBadge(row.status) },
    { headerLabel: 'Insurance Exp.', renderCell: (row: VehicleData) => <span className="text-text-secondary">{row.insurance_expiry_date || '—'}</span> },
    {
      headerLabel: 'Actions',
      renderCell: (row: VehicleData) => (
        <button onClick={(e) => { e.stopPropagation(); if (confirm('Delete this vehicle?')) deleteMutation.mutate(row.id); }} className="rounded-lg p-1.5 text-rose-400 hover:bg-rose-500/10">
          <Trash2 className="h-4 w-4" />
        </button>
      ),
      className: 'w-20',
    },
  ];

  return (
    <div className="animate-fade-in">
      <PageHeader title="Vehicle Management" description="Register and manage fleet vehicles" actionLabel="+ Register Vehicle" onActionClick={() => { reset(); setIsCreationModalOpen(true); }} />

      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input type="text" placeholder="Search vehicles..." value={searchText} onChange={(e) => { setSearchText(e.target.value); setCurrentPage(1); }} className="w-full rounded-xl border border-border-primary bg-surface-secondary py-2.5 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-raahi-500" />
        </div>
      </div>

      <DataTable columns={columns} data={vehicleListQuery.data?.items || []} isLoading={vehicleListQuery.isLoading} emptyStateMessage="No vehicles registered" />

      {vehicleListQuery.data && vehicleListQuery.data.total_pages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-text-secondary">Page {vehicleListQuery.data.page} of {vehicleListQuery.data.total_pages}</p>
          <div className="flex gap-2">
            <button disabled={currentPage <= 1} onClick={() => setCurrentPage(currentPage - 1)} className="rounded-lg border border-border-primary px-3 py-1.5 text-sm text-text-secondary hover:bg-surface-hover disabled:opacity-40">Previous</button>
            <button disabled={currentPage >= vehicleListQuery.data.total_pages} onClick={() => setCurrentPage(currentPage + 1)} className="rounded-lg border border-border-primary px-3 py-1.5 text-sm text-text-secondary hover:bg-surface-hover disabled:opacity-40">Next</button>
          </div>
        </div>
      )}

      {isCreationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
          <div className="glass-card w-full max-w-lg p-6 animate-fade-in mx-4">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-text-primary">Register New Vehicle</h2>
              <button onClick={() => setIsCreationModalOpen(false)} className="rounded-lg p-1 text-text-muted hover:text-text-primary"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSubmit((data) => createMutation.mutate(data))} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="mb-1 block text-xs font-medium text-text-secondary">Vehicle Number</label><input {...register('vehicle_number')} className="w-full rounded-lg border border-border-primary bg-surface-primary px-3 py-2 text-sm text-text-primary outline-none focus:border-raahi-500" />{errors.vehicle_number && <p className="mt-1 text-xs text-rose-400">{errors.vehicle_number.message}</p>}</div>
                <div><label className="mb-1 block text-xs font-medium text-text-secondary">Owner</label><select {...register('owner_employee_id')} className="w-full rounded-lg border border-border-primary bg-surface-primary px-3 py-2 text-sm text-text-primary outline-none focus:border-raahi-500"><option value="">Select owner</option>{(employeeOptionsQuery.data || []).map((e) => <option key={e.id} value={e.id}>{e.full_name} ({e.employee_code})</option>)}</select>{errors.owner_employee_id && <p className="mt-1 text-xs text-rose-400">{errors.owner_employee_id.message}</p>}</div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="mb-1 block text-xs font-medium text-text-secondary">Make</label><input {...register('make')} className="w-full rounded-lg border border-border-primary bg-surface-primary px-3 py-2 text-sm text-text-primary outline-none focus:border-raahi-500" />{errors.make && <p className="mt-1 text-xs text-rose-400">{errors.make.message}</p>}</div>
                <div><label className="mb-1 block text-xs font-medium text-text-secondary">Model</label><input {...register('model')} className="w-full rounded-lg border border-border-primary bg-surface-primary px-3 py-2 text-sm text-text-primary outline-none focus:border-raahi-500" />{errors.model && <p className="mt-1 text-xs text-rose-400">{errors.model.message}</p>}</div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div><label className="mb-1 block text-xs font-medium text-text-secondary">Capacity</label><input {...register('capacity')} type="number" defaultValue={4} className="w-full rounded-lg border border-border-primary bg-surface-primary px-3 py-2 text-sm text-text-primary outline-none focus:border-raahi-500" /></div>
                <div><label className="mb-1 block text-xs font-medium text-text-secondary">Fuel Type</label><select {...register('fuel_type')} className="w-full rounded-lg border border-border-primary bg-surface-primary px-3 py-2 text-sm text-text-primary outline-none focus:border-raahi-500"><option value="PETROL">Petrol</option><option value="DIESEL">Diesel</option><option value="ELECTRIC">Electric</option><option value="CNG">CNG</option></select></div>
                <div><label className="mb-1 block text-xs font-medium text-text-secondary">Insurance Exp.</label><input {...register('insurance_expiry_date')} type="date" className="w-full rounded-lg border border-border-primary bg-surface-primary px-3 py-2 text-sm text-text-primary outline-none focus:border-raahi-500" /></div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsCreationModalOpen(false)} className="rounded-xl px-4 py-2 text-sm font-medium text-text-secondary hover:bg-surface-hover">Cancel</button>
                <button type="submit" disabled={createMutation.isPending} className="rounded-xl bg-raahi-600 px-5 py-2 text-sm font-semibold text-white hover:bg-raahi-700 disabled:opacity-60">{createMutation.isPending ? 'Registering...' : 'Register Vehicle'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
