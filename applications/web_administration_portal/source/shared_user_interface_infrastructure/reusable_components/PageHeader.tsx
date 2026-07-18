/**
 * Page header with title, description, and optional action button.
 */

interface PageHeaderProperties {
  title: string;
  description?: string;
  actionLabel?: string;
  onActionClick?: () => void;
}

export function PageHeader({
  title,
  description,
  actionLabel,
  onActionClick,
}: PageHeaderProperties) {
  return (
    <div className="mb-8 flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-text-secondary">{description}</p>
        )}
      </div>
      {actionLabel && onActionClick && (
        <button
          onClick={onActionClick}
          className="rounded-xl bg-raahi-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-raahi-600/25 transition-all hover:bg-raahi-700 hover:shadow-raahi-600/40 active:scale-95"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
