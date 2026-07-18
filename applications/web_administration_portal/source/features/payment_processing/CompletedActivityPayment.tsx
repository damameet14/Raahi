import { PaymentStatusBadge } from './PaymentStatusBadge';
import { RazorpayCheckoutButton } from './RazorpayCheckoutButton';

export interface CompletedActivityPaymentProps {
  activityId: string;
  activityType?: string;
  paymentStatus: string;
  amount?: number;
  currency?: string;
  onPaymentCompleted?: () => void;
}

export function CompletedActivityPayment({
  activityId,
  activityType = 'trip',
  paymentStatus,
  amount,
  currency = 'INR',
  onPaymentCompleted,
}: CompletedActivityPaymentProps) {
  const normalizedStatus = paymentStatus.toLowerCase();
  const canRetryPayment = ['pending', 'created', 'failed', 'cancelled'].includes(
    normalizedStatus,
  );
  const isPaymentCompleted = normalizedStatus === 'completed';

  return (
    <article className="glass-card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">
          Completed {activityType} payment
        </p>
        <h3 className="mt-1 text-lg font-bold text-text-primary">
          Activity {activityId}
        </h3>
        {amount !== undefined && (
          <p className="mt-1 text-sm text-text-secondary">
            Payable amount: {currency} {amount.toFixed(2)}
          </p>
        )}
      </div>
      <div className="flex items-center gap-3">
        <PaymentStatusBadge status={paymentStatus} />
        {canRetryPayment && (
          <RazorpayCheckoutButton
            activityId={activityId}
            activityType={activityType}
            onPaymentCompleted={onPaymentCompleted}
          />
        )}
        {isPaymentCompleted && (
          <span className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-bold text-emerald-700">
            Paid
          </span>
        )}
      </div>
    </article>
  );
}

