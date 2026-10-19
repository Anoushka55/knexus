import { CardAction, DashboardCard } from '@/lib/engineering-observability/shared/DashboardCard';
import { overview } from '@/lib/engineering-observability/data/overview';
import type { JourneySeverity } from '@/lib/engineering-observability/data/customerJourneys';
import { getIcon } from '@/lib/engineering-observability/icons';

const SEVERITY_CLASS: Record<JourneySeverity, string> = {
  High: 'text-status-critical',
  Medium: 'text-status-warning',
  Low: 'text-status-healthy',
  None: 'text-slate-400',
};

export function BusinessImpactsCard() {
  return (
    <DashboardCard title="Top Business Impacts" action={<CardAction />} bodyClassName="mt-3">
      <ul className="divide-y divide-slate-100">
        {overview.topBusinessImpacts.map((journey) => {
          const Icon = getIcon(journey.icon);

          return (
            <li key={journey.id} className="flex items-center gap-3 py-[7px]">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-kpmg-blue-light">
                <Icon className="h-4 w-4 text-kpmg-blue-mid" strokeWidth={2} />
              </span>

              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold leading-tight text-slate-900">
                  {journey.name}
                </p>
                <p className="mt-0.5 truncate text-[12px] leading-tight text-slate-500">{journey.status}</p>
              </div>

              <div className="shrink-0 text-right">
                <p className="text-[14px] font-bold text-slate-900">{journey.impact}</p>
                <p className={`text-[11px] font-semibold ${SEVERITY_CLASS[journey.severity]}`}>
                  {journey.severity}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </DashboardCard>
  );
}
