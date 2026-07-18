import { useQuery } from '@tanstack/react-query';
import { CreditCard } from 'lucide-react';
import { LoadingSpinner } from '@/shared_user_interface_infrastructure/reusable_components/LoadingSpinner';
import { PageHeader } from '@/shared_user_interface_infrastructure/reusable_components/PageHeader';
import { listMyPayments } from './paymentProcessingApiClient';
import { PaymentStatusBadge } from './PaymentStatusBadge';
import { RazorpayCheckoutButton } from './RazorpayCheckoutButton';

export function PaymentHistory() {
  const paymentHistoryQuery = useQuery({
    queryKey: ['my-payments'],
    queryFn: listMyPayments,
  });

  if (paymentHistoryQuery.isLoading) {
    return <LoadingSpinner message="Loading payments..." />;
  }

  const payments = paymentHistoryQuery.data || [];

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Payments"
        description="Track completed-activity payments and retry pending Razorpay checkouts."
      />

      <section className="glass-card overflow-hidden">
        <div className="border-b border-border-primary p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-raahi-500 text-white">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-text-primary">My payment history</h2>
              <p className="text-sm text-text-secondary">
                Razorpay orders are created only from backend-verified completed activities.
              </p>
            </div>
          </div>
        </div>

        {payments.length === 0 ? (
          <div className="p-8 text-center text-text-secondary">
            No completed-activity payments are available yet.
          </div>
        ) : (
          <div className="divide-y divide-border-primary">
            {payments.map((payment) => (
              <div
                key={payment.id}
                className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between"
              >
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">
                    {payment.activity_type} / {payment.activity_id}
                  </p>
                  <p className="mt-1 text-xl font-bold text-text-primary">
                    {payment.currency} {payment.amount.toFixed(2)}
                  </p>
                  {payment.razorpay_payment_id && (
                    <p className="mt-1 text-sm text-text-secondary">
                      Razorpay payment: {payment.razorpay_payment_id}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <PaymentStatusBadge status={payment.status} />
                  {payment.is_retry_available && (
                    <RazorpayCheckoutButton
                      activityId={payment.activity_id}
                      activityType={payment.activity_type}
                      onPaymentCompleted={() => paymentHistoryQuery.refetch()}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

