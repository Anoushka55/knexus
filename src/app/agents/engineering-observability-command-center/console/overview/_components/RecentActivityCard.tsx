import { ArrowRight } from 'lucide-react';

import { DashboardCard } from '@/lib/engineering-observability/shared/DashboardCard';
import { overview, type ActivityTone } from '@/lib/engineering-observability/data/overview';

/** Solid tag fills, unlike the tinted StatusPill used elsewhere. */
const TAG_CLASS: Record<ActivityTone, string> = {
  purple: 'bg-kpmg-purple',
  red: 'bg-status-critical',
  blue: 'bg-kpmg-blue-mid',
  orange: 'bg-status-warning',
  amber: 'bg-amber-500',
};

export function RecentActivityCard() {
  return (
    <DashboardCard
      title="Recent Activity"
      bodyClassName="mt-3"
      footer={
        <button
          type="button"
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-kpmg-blue-mid transition-colors hover:text-kpmg-blue-hover"
        >
          View all activity
          <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
        </button>
      }
    >
      <ul className="space-y-[11px]">
        {overview.recentActivity.map((item) => (
          <li key={`${item.time}-${item.tag}`} className="flex items-center gap-3">
            <span className="w-[62px] shrink-0 text-[12px] text-slate-500">{item.time}</span>
            <span className="min-w-0 flex-1 truncate text-[12.5px] text-slate-700">
              {item.text}
            </span>
            <span
              className={`shrink-0 rounded px-1.5 py-[3px] text-[10px] font-bold leading-none text-white ${
                TAG_CLASS[item.tagTone]
              }`}
            >
              {item.tag}
            </span>
          </li>
        ))}
      </ul>
    </DashboardCard>
  );
}
