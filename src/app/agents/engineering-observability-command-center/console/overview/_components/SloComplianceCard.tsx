import { ArrowRight } from 'lucide-react';

import { CardAction, DashboardCard } from '@/lib/engineering-observability/shared/DashboardCard';
import { overview } from '@/lib/engineering-observability/data/overview';
import { formatPct } from '@/lib/engineering-observability/utils';

export function SloComplianceCard() {
  return (
    <DashboardCard
      title="SLO Compliance"
      action={<CardAction />}
      bodyClassName="mt-3"
      footer={
        <button
          type="button"
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-kpmg-blue-mid transition-colors hover:text-kpmg-blue-hover"
        >
          View all SLOs
          <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
        </button>
      }
    >
      <ul className="space-y-[10px]">
        {overview.sloCompliance.map((row) => {
          const improved = row.delta >= 0;

          return (
            <li key={row.service} className="flex items-center gap-3">
              <span className="w-[112px] shrink-0 whitespace-nowrap text-[12px] text-slate-700">
                {row.service}
              </span>

              <span className="h-[7px] min-w-0 flex-1 overflow-hidden rounded-full bg-slate-100">
                <span
                  className="block h-full rounded-full bg-kpmg-blue-mid"
                  style={{ width: `${row.pct}%` }}
                />
              </span>

              <span className="w-[44px] shrink-0 text-right text-[12.5px] font-semibold text-slate-900">
                {formatPct(row.pct)}
              </span>

              <span
                className={`w-[52px] shrink-0 text-right text-[11.5px] font-semibold ${
                  improved ? 'text-status-healthy' : 'text-status-critical'
                }`}
              >
                <span aria-hidden="true" className="mr-0.5 text-[8px]">
                  {improved ? '▲' : '▼'}
                </span>
                {formatPct(Math.abs(row.delta))}
              </span>
            </li>
          );
        })}
      </ul>
    </DashboardCard>
  );
}
