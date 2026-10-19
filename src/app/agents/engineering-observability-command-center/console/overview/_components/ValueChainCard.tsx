import { ArrowRight } from 'lucide-react';
import { Fragment } from 'react';

import { CardAction, DashboardCard } from '@/lib/engineering-observability/shared/DashboardCard';
import { overview } from '@/lib/engineering-observability/data/overview';
import { getIcon } from '@/lib/engineering-observability/icons';

/**
 * The platform's core value proposition, read left to right:
 * signals -> infrastructure -> services -> journeys -> transactions -> money.
 */
export function ValueChainCard() {
  return (
    <DashboardCard
      title="Signal to Business Value Chain"
      action={<CardAction>View full analysis</CardAction>}
      bodyClassName="mt-5"
    >
      <div className="flex items-start">
        {overview.signalToBusinessChain.map((link, index) => {
          const Icon = getIcon(link.icon);

          return (
            <Fragment key={link.label}>
              {index > 0 ? (
                <ArrowRight
                  aria-hidden="true"
                  className="mt-[26px] h-4 w-4 shrink-0 text-slate-300"
                  strokeWidth={2}
                />
              ) : null}

              <div className="flex min-w-0 flex-1 flex-col items-center px-1 text-center">
                <span className="flex h-[58px] w-[58px] items-center justify-center rounded-full bg-kpmg-blue-light">
                  <Icon className="h-6 w-6 text-kpmg-blue-mid" strokeWidth={1.75} />
                </span>

                <p className="mt-2.5 text-[12px] font-semibold text-slate-700">{link.label}</p>
                <p className="mt-1.5 text-[22px] font-bold leading-none text-slate-900">
                  {link.value}
                </p>
                <p className="mt-1.5 text-[11px] text-slate-500">{link.caption}</p>
                <p className="mt-1 text-[11px] font-semibold text-status-healthy">
                  <span aria-hidden="true" className="mr-0.5 text-[8px]">
                    ▲
                  </span>
                  {link.delta.replace('+', '')}
                </p>
              </div>
            </Fragment>
          );
        })}
      </div>
    </DashboardCard>
  );
}
