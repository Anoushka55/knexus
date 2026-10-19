import type { LucideIcon } from 'lucide-react';

import { Sparkline, type SparklineTone } from '@/lib/engineering-observability/shared/Sparkline';
import { cn } from '@/lib/engineering-observability/utils';

export type KpiTint = 'blue' | 'red' | 'orange' | 'green' | 'purple' | 'teal' | 'yellow';
export type KpiDeltaTone = 'up-good' | 'up-bad' | 'down-good' | 'down-bad' | 'auto';

const TINT: Record<KpiTint, { icon: string; bg: string; spark: SparklineTone }> = {
  blue: { icon: 'text-kpmg-blue-mid', bg: 'bg-kpmg-blue-mid/10', spark: 'blue' },
  red: { icon: 'text-status-critical', bg: 'bg-status-critical/10', spark: 'red' },
  orange: { icon: 'text-status-warning', bg: 'bg-status-warning/10', spark: 'orange' },
  green: { icon: 'text-status-healthy', bg: 'bg-status-healthy/10', spark: 'green' },
  purple: { icon: 'text-kpmg-purple', bg: 'bg-kpmg-purple/10', spark: 'purple' },
  teal: { icon: 'text-kpmg-teal', bg: 'bg-kpmg-teal/10', spark: 'green' },
  yellow: { icon: 'text-amber-500', bg: 'bg-amber-500/10', spark: 'orange' },
};

const DELTA_CLASS = {
  positive: 'text-status-healthy',
  negative: 'text-status-critical',
  neutral: 'text-slate-400',
} as const;

export interface KpiTileProps {
  icon: LucideIcon;
  iconTint?: KpiTint;
  label: string;
  value: string | number;
  valueSuffix?: string;
  delta?: number | string;
  /** unit appended to the delta, e.g. "%" or "m" */
  deltaSuffix?: string;
  deltaLabel?: string;
  deltaTone?: KpiDeltaTone;
  sparkline?: number[];
  className?: string;
}

/** Pulls the leading signed number out of a delta that may arrive as "+12%". */
function parseDelta(delta: number | string): number {
  if (typeof delta === 'number') return delta;
  const match = delta.match(/-?\d+(\.\d+)?/);
  return match ? Number(match[0]) : 0;
}

/** The triangle carries the direction, so the number renders unsigned. */
function formatDeltaText(delta: number | string): string {
  if (typeof delta === 'string') return delta.replace(/^[+-]/, '');
  return Number.isInteger(delta) ? Math.abs(delta).toString() : Math.abs(delta).toFixed(1);
}

function resolveDeltaTone(
  numeric: number,
  deltaTone: KpiDeltaTone,
): 'positive' | 'negative' | 'neutral' {
  if (numeric === 0) return 'neutral';
  const upIsGood = deltaTone === 'up-good' || deltaTone === 'down-bad' || deltaTone === 'auto';
  const isUp = numeric > 0;
  return isUp === upIsGood ? 'positive' : 'negative';
}

export function KpiTile({
  icon: Icon,
  iconTint = 'blue',
  label,
  value,
  valueSuffix,
  delta,
  deltaSuffix,
  deltaLabel,
  deltaTone = 'auto',
  sparkline,
  className,
}: KpiTileProps) {
  const tint = TINT[iconTint];
  const numericDelta = delta === undefined ? 0 : parseDelta(delta);
  const tone = resolveDeltaTone(numericDelta, deltaTone);

  return (
    <div
      className={cn(
        'flex flex-1 items-center gap-3.5 rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-card',
        className,
      )}
    >
      <div
        className={cn(
          'flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full',
          tint.bg,
        )}
      >
        <Icon className={cn('h-[22px] w-[22px]', tint.icon)} strokeWidth={2} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="whitespace-nowrap text-[13px] font-medium text-slate-600">{label}</p>

        <div className="mt-1 flex items-baseline gap-1">
          <span className="text-[30px] font-bold leading-none tracking-tight text-slate-900">
            {value}
          </span>
          {valueSuffix ? (
            <span className="text-[13px] font-medium text-slate-400">{valueSuffix}</span>
          ) : null}
        </div>

        {delta !== undefined ? (
          <div className="mt-2 flex items-center gap-1 text-xs">
            <span className={cn('font-semibold', DELTA_CLASS[tone])}>
              <span aria-hidden="true" className="mr-0.5 text-[9px]">
                {numericDelta > 0 ? '▲' : numericDelta < 0 ? '▼' : '■'}
              </span>
              {formatDeltaText(delta)}
              {deltaSuffix}
            </span>
            {deltaLabel ? <span className="text-slate-400">{deltaLabel}</span> : null}
          </div>
        ) : null}

        {sparkline?.length ? (
          <Sparkline data={sparkline} tone={tint.spark} className="mt-3" />
        ) : null}
      </div>
    </div>
  );
}
