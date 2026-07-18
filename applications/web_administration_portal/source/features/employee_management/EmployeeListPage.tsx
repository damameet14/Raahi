/**
 * Employee list page with search, filters, and CRUD actions.
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, UserCheck, UserX, Trash2, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { apiClient } from '@/shared_user_interface_infrastructure/backend_communication/api_client';
import { DataTable } from '@/shared_user_interface_infrastructure/reusable_components/DataTable';
import { PageHeader } from '@/shared_user_interface_infrastructure/reusable_components/PageHeader';
import toast from 'react-hot-toast';

interface EmployeeData {
  id: string;
  employee_code: string;
  full_name: string;
  email: string;
  phone: string | null;
  department: string;
  designation: string;
  status: string;
  is_driver: boolean;
}

interface PaginatedEmployeeResponse {
  items: EmployeeData[];
  total_count: number;
  page: number;
  page_size: number;
  total_pages: number;
}

const createEmployeeSchema = z.object({
  employee_code: z.string().min(1, 'Employee code is required'),
  full_name: z.string().min(1, 'Full name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().optional(),
  department: z.string().min(1, 'Department is required'),
  designation: z.string().min(1, 'Designation is required'),
  is_driver: z.boolean().default(false),
});

type CreateEmployeeFormData = z.input<typeof createEmployeeSchema>;

export function EmployeeListPage() {
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchText, setSearchText] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isCreationModalOpen, setIsCreationModalOpen] = useState(false);

  const employeeListQuery = useQuery({
    queryKey: ['employees', currentPage, searchText, departmentFilter, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        page_size: '15',
        search_query: searchText,
      });
      if (departmentFilter) params.append('department', departmentFilter);
      if (statusFilter) params.append('status', statusFilter);
      const response = await apiClient.get<PaginatedEmployeeResponse>(`/api/v1/employees?${params}`);
      return response.data;
    },
  });

  const activateMutation = useMutation({
    mutationFn: (employeeId: string) => apiClient.patch(`/api/v1/employees/${employeeId}/activate`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['employees'] }); toast.success('Employee activated'); },
  });

  const deactivateMutation = useMutation({
    mutationFn: (employeeId: string) => apiClient.patch(`/api/v1/employees/${employeeId}/deactivate`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['employees'] }); toast.success('Employee deactivated'); },
  });

  const deleteMutation = useMutation({
    mutationFn: (employeeId: string) => apiClient.delete(`/api/v1/employees/${employeeId}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['employees'] }); toast.success('Employee deleted'); },
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateEmployeeFormData) => apiClient.post('/api/v1/employees', {
      ...data,
      is_driver: data.is_driver ?? false,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setIsCreationModalOpen(false);
      toast.success('Employee created successfully');
    },
    onError: () => toast.error('Failed to create employee'),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateEmployeeFormData>({
    resolver: zodResolver(createEmployeeSchema),
  });

  const onCreateSubmit = (data: CreateEmployeeFormData) => createMutation.mutate(data);

  const columns = [
    { headerLabel: 'Code', accessorKey: 'employee_code' as const, className: 'w-24' },
    { headerLabel: 'Name', accessorKey: 'full_name' as const },
    { headerLabel: 'Email', accessorKey: 'email' as const },
    { headerLabel: 'Department', accessorKey: 'department' as const },
    { headerLabel: 'Designation', accessorKey: 'designation' as const },
    {
      headerLabel: 'Status',
      renderCell: (row: EmployeeData) => (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
          row.status === 'ACTIVE'
            ? 'bg-emerald-500/15 text-emerald-400'
            : 'bg-rose-500/15 text-rose-400'
        }`}>
          {row.status}
        </span>
      ),
    },
    {
      headerLabel: 'Driver',
      renderCell: (row: EmployeeData) => (
        <span className={row.is_driver ? 'text-emerald-400' : 'text-text-muted'}>
          {row.is_driver ? 'Yes' : 'No'}
        </span>
      ),
      className: 'w-20',
    },
    {
      headerLabel: 'Actions',
      renderCell: (row: EmployeeData) => (
        <div className="flex items-center gap-1">
          {row.status === 'ACTIVE' ? (
            <button onClick={(e) => { e.stopPropagation(); deactivateMutation.mutate(row.id); }} className="rounded-lg p-1.5 text-amber-400 hover:bg-amber-500/10" title="Deactivate">
              <UserX className="h-4 w-4" />
            </button>
          ) : (
            <button onClick={(e) => { e.stopPropagation(); activateMutation.mutate(row.id); }} className="rounded-lg p-1.5 text-emerald-400 hover:bg-emerald-500/10" title="Activate">
              <UserCheck className="h-4 w-4" />
            </button>
          )}
          <button onClick={(e) => { e.stopPropagation(); if (confirm('Delete this employee?')) deleteMutation.mutate(row.id); }} className="rounded-lg p-1.5 text-rose-400 hover:bg-rose-500/10" title="Delete">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
      className: 'w-28',
    },
  ];

  const departments = ['Engineering', 'Product', 'Design', 'HR', 'Finance', 'Marketing', 'Sales', 'Operations', 'Legal'];

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Employee Management"
        description="Manage your organization's employees"
        actionLabel="+ Add Employee"
        onActionClick={() => { reset(); setIsCreationModalOpen(true); }}
      />

      {/* ── Filters ──────────────────────────────────── */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search by name, email, or code..."
            value={searchText}
            onChange={(e) => { setSearchText(e.target.value); setCurrentPage(1); }}
            className="w-full rounded-xl border border-border-primary bg-surface-secondary py-2.5 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-raahi-500"
          />
        </div>
        <select
          value={departmentFilter}
          onChange={(e) => { setDepartmentFilter(e.target.value); setCurrentPage(1); }}
          className="rounded-xl border border-border-primary bg-surface-secondary px-4 py-2.5 text-sm text-text-primary outline-none focus:border-raahi-500"
        >
          <option value="">All Departments</option>
          {departments.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
          className="rounded-xl border border-border-primary bg-surface-secondary px-4 py-2.5 text-sm text-text-primary outline-none focus:border-raahi-500"
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </div>

      {/* ── Data table ───────────────────────────────── */}
      <DataTable
        columns={columns}
        data={employeeListQuery.data?.items || []}
        isLoading={employeeListQuery.isLoading}
        emptyStateMessage="No employees found"
      />

      {/* ── Pagination ───────────────────────────────── */}
      {employeeListQuery.data && employeeListQuery.data.total_pages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-text-secondary">
            Showing page {employeeListQuery.data.page} of {employeeListQuery.data.total_pages} ({employeeListQuery.data.total_count} total)
          </p>
          <div className="flex gap-2">
            <button disabled={currentPage <= 1} onClick={() => setCurrentPage(currentPage - 1)} className="rounded-lg border border-border-primary px-3 py-1.5 text-sm text-text-secondary hover:bg-surface-hover disabled:opacity-40">Previous</button>
            <button disabled={currentPage >= employeeListQuery.data.total_pages} onClick={() => setCurrentPage(currentPage + 1)} className="rounded-lg border border-border-primary px-3 py-1.5 text-sm text-text-secondary hover:bg-surface-hover disabled:opacity-40">Next</button>
          </div>
        </div>
      )}

      {/* ── Creation modal ───────────────────────────── */}
      {isCreationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
          <div className="glass-card w-full max-w-lg p-6 animate-fade-in mx-4">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-text-primary">Add New Employee</h2>
              <button onClick={() => setIsCreationModalOpen(false)} className="rounded-lg p-1 text-text-muted hover:text-text-primary"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSubmit(onCreateSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-text-secondary">Employee Code</label>
                  <input {...register('employee_code')} className="w-full rounded-lg border border-border-primary bg-surface-primary px-3 py-2 text-sm text-text-primary outline-none focus:border-raahi-500" />
                  {errors.employee_code && <p className="mt-1 text-xs text-rose-400">{errors.employee_code.message}</p>}
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-text-secondary">Full Name</label>
                  <input {...register('full_name')} className="w-full rounded-lg border border-border-primary bg-surface-primary px-3 py-2 text-sm text-text-primary outline-none focus:border-raahi-500" />
                  {errors.full_name && <p className="mt-1 text-xs text-rose-400">{errors.full_name.message}</p>}
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-text-secondary">Email</label>
                <input {...register('email')} type="email" className="w-full rounded-lg border border-border-primary bg-surface-primary px-3 py-2 text-sm text-text-primary outline-none focus:border-raahi-500" />
                {errors.email && <p className="mt-1 text-xs text-rose-400">{errors.email.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-text-secondary">Department</label>
                  <select {...register('department')} className="w-full rounded-lg border border-border-primary bg-surface-primary px-3 py-2 text-sm text-text-primary outline-none focus:border-raahi-500">
                    <option value="">Select</option>
                    {departments.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                  {errors.department && <p className="mt-1 text-xs text-rose-400">{errors.department.message}</p>}
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-text-secondary">Designation</label>
                  <input {...register('designation')} className="w-full rounded-lg border border-border-primary bg-surface-primary px-3 py-2 text-sm text-text-primary outline-none focus:border-raahi-500" />
                  {errors.designation && <p className="mt-1 text-xs text-rose-400">{errors.designation.message}</p>}
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-text-secondary">Phone (optional)</label>
                <input {...register('phone')} className="w-full rounded-lg border border-border-primary bg-surface-primary px-3 py-2 text-sm text-text-primary outline-none focus:border-raahi-500" />
              </div>
              <div className="flex items-center gap-2">
                <input {...register('is_driver')} type="checkbox" id="is-driver-checkbox" className="h-4 w-4 rounded border-border-primary bg-surface-primary accent-raahi-600" />
                <label htmlFor="is-driver-checkbox" className="text-sm text-text-secondary">This employee is a driver</label>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsCreationModalOpen(false)} className="rounded-xl px-4 py-2 text-sm font-medium text-text-secondary hover:bg-surface-hover">Cancel</button>
                <button type="submit" disabled={createMutation.isPending} className="rounded-xl bg-raahi-600 px-5 py-2 text-sm font-semibold text-white hover:bg-raahi-700 disabled:opacity-60">
                  {createMutation.isPending ? 'Creating...' : 'Create Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
