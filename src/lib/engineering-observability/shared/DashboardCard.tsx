import type { ReactNode } from 'react';

import { cn } from '@/lib/engineering-observability/utils';

export interface DashboardCardProps {
  title: string;
  /** typically a "View all →" link */
  action?: ReactNode;
  footer?: ReactNode;
  className?: string;
  bodyClassName?: string;
  children?: ReactNode;
}

export function DashboardCard({
  title,
  action,
  footer,
  className,
  bodyClassName,
  children,
}: DashboardCardProps) {
  return (
    <div
      className={cn(
        'flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-card',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[15px] font-semibold text-slate-900">{title}</h2>
        {action ? <div className="flex shrink-0 items-center gap-2">{action}</div> : null}
      </div>

      <div className={cn('mt-4 flex-1', bodyClassName)}>{children}</div>

      {footer ? <div className="mt-4 border-t border-slate-100 pt-4">{footer}</div> : null}
    </div>
  );
}

/** The standard "View all →" affordance used in card headers. */
export function CardAction({ children = 'View all' }: { children?: ReactNode }) {
  return (
    <button
      type="button"
      className="text-[13px] font-medium text-kpmg-blue-mid transition-colors hover:text-kpmg-blue-hover"
    >
      {children} <span aria-hidden="true">→</span>
    </button>
  );
}
