/**
 * Platform super-admin onboarding review page.
 *
 * Lists organization registration requests and lets the Raahi super-admin
 * approve (activating the tenant and revealing one-time admin credentials) or
 * reject them with a reason.
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Building2, CheckCircle2, XCircle, Clock, Copy } from 'lucide-react';
import { apiClient } from '@/shared_user_interface_infrastructure/backend_communication/api_client';
import { PageHeader } from '@/shared_user_interface_infrastructure/reusable_components/PageHeader';
import toast from 'react-hot-toast';

interface OnboardingOrganization {
  id: string;
  name: string;
  slug: string;
  email_domain: string | null;
  industry: string | null;
  address: string | null;
  approval_status: string;
  rejection_reason: string | null;
  is_active: boolean;
  administrator_email: string | null;
  administrator_full_name: string | null;
  created_at: string;
}

interface ApprovalResult {
  administrator_email: string;
  temporary_password: string;
}

const statusFilters = ['PENDING', 'APPROVED', 'REJECTED', 'ALL'] as const;
type StatusFilter = (typeof statusFilters)[number];

const statusBadgeStyles: Record<string, string> = {
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  APPROVED: 'bg-raahi-50 text-raahi-700 border-raahi-200',
  REJECTED: 'bg-rose-50 text-rose-600 border-rose-200',
};

export function OnboardingRequestsPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('PENDING');
  const [approvalResult, setApprovalResult] = useState<ApprovalResult | null>(null);

  const organizationsQuery = useQuery({
    queryKey: ['platform-organizations', statusFilter],
    queryFn: async () => {
      const query =
        statusFilter === 'ALL' ? '' : `?approval_status=${statusFilter}`;
      const response = await apiClient.get<OnboardingOrganization[]>(
        `/api/v1/platform/organizations${query}`
      );
      return response.data;
    },
  });

  const approveMutation = useMutation({
    mutationFn: (organizationId: string) =>
      apiClient.post(`/api/v1/platform/organizations/${organizationId}/approve`),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['platform-organizations'] });
      setApprovalResult({
        administrator_email: response.data.administrator_email,
        temporary_password: response.data.temporary_password,
      });
      toast.success('Organization approved — credentials emailed to the admin.');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Could not approve organization.');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ organizationId, reason }: { organizationId: string; reason: string }) =>
      apiClient.post(`/api/v1/platform/organizations/${organizationId}/reject`, {
        rejection_reason: reason,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-organizations'] });
      toast.success('Organization rejected.');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Could not reject organization.');
    },
  });

  const handleReject = (organization: OnboardingOrganization) => {
    const reason = window.prompt(
      `Reason for rejecting ${organization.name}?`,
      'Domain could not be verified.'
    );
    if (reason && reason.trim().length >= 3) {
      rejectMutation.mutate({ organizationId: organization.id, reason: reason.trim() });
    }
  };

  const organizations = organizationsQuery.data ?? [];

  return (
    <div>
      <PageHeader
        title="Onboarding requests"
        description="Review and approve organizations requesting access to Raahi."
      />

      {approvalResult && (
        <div className="mb-6 rounded-xl border border-raahi-200 bg-raahi-50 p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-raahi-800">
                Temporary admin credentials (shown once)
              </p>
              <p className="mt-1 text-sm text-text-secondary">
                {approvalResult.administrator_email} ·{' '}
                <span className="font-mono font-semibold text-text-primary">
                  {approvalResult.temporary_password}
                </span>
              </p>
              <p className="mt-1 text-xs text-text-muted">
                These were also emailed to the administrator.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(approvalResult.temporary_password);
                  toast.success('Password copied');
                }}
                className="flex items-center gap-1 rounded-lg border border-raahi-200 bg-white px-3 py-1.5 text-xs font-semibold text-raahi-700"
              >
                <Copy className="h-3.5 w-3.5" /> Copy
              </button>
              <button
                onClick={() => setApprovalResult(null)}
                className="rounded-lg px-3 py-1.5 text-xs font-semibold text-text-muted"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6 flex gap-2">
        {statusFilters.map((filter) => (
          <button
            key={filter}
            onClick={() => setStatusFilter(filter)}
            className={`rounded-lg border px-4 py-2 text-sm font-semibold transition-all ${
              statusFilter === filter
                ? 'border-raahi-500 bg-white text-raahi-700 shadow-sm'
                : 'border-border-primary bg-surface-secondary text-text-secondary hover:text-text-primary'
            }`}
          >
            {filter.charAt(0) + filter.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {organizationsQuery.isLoading ? (
        <p className="text-sm text-text-secondary">Loading requests…</p>
      ) : organizations.length === 0 ? (
        <div className="rounded-xl border border-border-primary bg-surface-secondary p-10 text-center">
          <Clock className="mx-auto mb-3 h-8 w-8 text-text-muted" />
          <p className="text-sm font-medium text-text-secondary">
            No {statusFilter.toLowerCase()} organizations.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {organizations.map((organization) => (
            <div
              key={organization.id}
              className="rounded-xl border border-border-primary bg-white p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-raahi-50 text-raahi-600">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-text-primary">
                        {organization.name}
                      </h3>
                      <span
                        className={`rounded-md border px-2 py-0.5 text-[11px] font-semibold ${
                          statusBadgeStyles[organization.approval_status] ??
                          'bg-surface-tertiary text-text-secondary border-border-primary'
                        }`}
                      >
                        {organization.approval_status}
                      </span>
                    </div>
                    <p className="mt-0.5 text-sm text-text-secondary">
                      @{organization.email_domain} · {organization.industry || 'Industry N/A'}
                    </p>
                    <p className="mt-0.5 text-xs text-text-muted">
                      Admin: {organization.administrator_full_name} (
                      {organization.administrator_email})
                    </p>
                    {organization.rejection_reason && (
                      <p className="mt-1 text-xs text-rose-600">
                        Reason: {organization.rejection_reason}
                      </p>
                    )}
                  </div>
                </div>

                {organization.approval_status === 'PENDING' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => approveMutation.mutate(organization.id)}
                      disabled={approveMutation.isPending}
                      className="flex items-center gap-1.5 rounded-lg bg-raahi-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-raahi-700 active:scale-95"
                    >
                      <CheckCircle2 className="h-4 w-4" /> Approve
                    </button>
                    <button
                      onClick={() => handleReject(organization)}
                      disabled={rejectMutation.isPending}
                      className="flex items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-600 transition-all hover:bg-rose-50 active:scale-95"
                    >
                      <XCircle className="h-4 w-4" /> Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
