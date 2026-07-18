interface PaymentStatusBadgeProps {
  status: string;
}

const statusClassNameByStatus: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  created: 'bg-sky-50 text-sky-700 border-sky-200',
  processing: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  failed: 'bg-rose-50 text-rose-700 border-rose-200',
  cancelled: 'bg-slate-50 text-slate-700 border-slate-200',
  refunded: 'bg-purple-50 text-purple-700 border-purple-200',
};

export function PaymentStatusBadge({ status }: PaymentStatusBadgeProps) {
  const normalizedStatus = status.toLowerCase();
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${
        statusClassNameByStatus[normalizedStatus] || 'bg-slate-50 text-slate-700 border-slate-200'
      }`}
    >
      {normalizedStatus.replace(/_/g, ' ')}
    </span>
  );
}
