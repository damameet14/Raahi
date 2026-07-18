/**
 * Reusable statistics card component for dashboard metrics.
 */

import { type LucideIcon } from 'lucide-react';

interface StatisticsCardProperties {
  title: string;
  value: string | number;
  icon: LucideIcon;
  gradientClassName: string;
  changePercentage?: number;
  changeLabel?: string;
  contextLabel?: string;
}

export function StatisticsCard({
  title,
  value,
  icon: IconComponent,
  gradientClassName,
  changePercentage,
  changeLabel,
  contextLabel,
}: StatisticsCardProperties) {
  return (
    <div className="glass-card p-5 animate-fade-in hover:scale-[1.02] transition-transform duration-200">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-text-secondary mb-1">{title}</p>
          <p className="text-2xl font-bold text-text-primary">{value}</p>
          {changePercentage !== undefined && (
            <div className="mt-2 flex items-center gap-1">
              <span
                className={`text-xs font-semibold ${
                  changePercentage >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {changePercentage >= 0 ? '+' : ''}
                {changePercentage}%
              </span>
              {changeLabel && (
                <span className="text-xs text-text-muted">{changeLabel}</span>
              )}
            </div>
          )}
          {contextLabel && (
            <p className="mt-3 text-xs leading-5 text-text-muted">{contextLabel}</p>
          )}
        </div>
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${gradientClassName} shadow-lg`}
        >
          <IconComponent className="h-5 w-5 text-white" />
        </div>
      </div>
    </div>
  );
}
