import { CardAction, DashboardCard } from '@/lib/engineering-observability/shared/DashboardCard';
import { StatusPill, type StatusTone } from '@/lib/engineering-observability/shared/StatusPill';
import { overview } from '@/lib/engineering-observability/data/overview';

const PRIORITY_TONE: Record<'High' | 'Medium' | 'Low', StatusTone> = {
  High: 'high',
  Medium: 'medium',
  Low: 'low',
};

export function AiPrioritiesCard() {
  return (
    <DashboardCard title="AI Priorities" action={<CardAction />} bodyClassName="mt-3">
      <ul className="space-y-[7px]">
        {overview.aiPriorities.map((priority) => (
          <li key={priority.rank} className="flex items-start gap-2.5">
            <span className="mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-kpmg-blue-mid text-[10px] font-bold text-white">
              {priority.rank}
            </span>

            <div className="min-w-0 flex-1">
              <p className="truncate text-[12.5px] font-semibold leading-none text-slate-900">
                {priority.title}
              </p>
              <p className="mt-1 truncate text-[11.5px] leading-none text-slate-500">{priority.subtitle}</p>
            </div>

            <StatusPill
              label={priority.priority}
              tone={PRIORITY_TONE[priority.priority]}
              className="mt-0.5 shrink-0"
            />
          </li>
        ))}
      </ul>
    </DashboardCard>
  );
}
