import Link from 'next/link';

import { CardAction, DashboardCard } from '@/lib/engineering-observability/shared/DashboardCard';
import { StatusPill } from '@/lib/engineering-observability/shared/StatusPill';
import { customerJourneys } from '@/lib/engineering-observability/data/customerJourneys';
import { incidents } from '@/lib/engineering-observability/data/incidents';
import { getIcon } from '@/lib/engineering-observability/icons';
import { Settings } from 'lucide-react';

/** The P1s, which is what the command centre leads with. */
const criticalIncidents = incidents.filter((incident) => incident.severity === 'P1');

/** A journey chip carries the journey's own icon; a service chip gets a cog. */
function entityIconName(journey: string | undefined) {
  if (!journey) return undefined;
  return customerJourneys.find((candidate) => candidate.name === journey)?.icon;
}

export function CriticalIncidentsCard() {
  return (
    <DashboardCard title="Critical Incidents" action={<CardAction />} bodyClassName="mt-3">
      <ul className="divide-y divide-slate-100">
        {criticalIncidents.map((incident) => {
          const entity = incident.journey ?? incident.service;
          const iconName = entityIconName(incident.journey);
          const Icon = iconName ? getIcon(iconName) : Settings;

          return (
            <li key={incident.id} className="flex items-start gap-2.5 py-[11px]">
              <StatusPill label={incident.severity} tone="p1" className="mt-0.5 shrink-0" />

              <div className="min-w-0 flex-1">
                <Link
                  href="/incidents"
                  className="block truncate text-[13px] font-semibold leading-tight text-slate-900 hover:text-kpmg-blue-mid"
                >
                  {incident.title}
                </Link>
                <p className="mt-0.5 whitespace-nowrap text-[11.5px] leading-tight text-slate-500">
                  {incident.summary}
                </p>
                <p className="mt-1 text-[11px] text-slate-400">
                  Started {incident.started} • {incident.duration} ago
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-1.5 pt-0.5">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-kpmg-blue-light">
                  <Icon className="h-[13px] w-[13px] text-kpmg-blue-mid" strokeWidth={2} />
                </span>
                <span className="whitespace-nowrap text-[11.5px] font-medium text-slate-700">{entity}</span>
              </div>
            </li>
          );
        })}
      </ul>
    </DashboardCard>
  );
}
