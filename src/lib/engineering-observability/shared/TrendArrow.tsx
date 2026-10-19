import { cn } from '@/lib/engineering-observability/utils';

export type TrendDirection = 'up' | 'down' | 'flat';
/** Which direction counts as an improvement for this metric. */
export type TrendContext = 'higher-is-better' | 'lower-is-better' | 'neutral';

export interface TrendArrowProps {
  direction: TrendDirection;
  context?: TrendContext;
  /** e.g. "+6.4%" — rendered next to the triangle */
  value?: string;
  className?: string;
}

export function resolveTrendTone(
  direction: TrendDirection,
  context: TrendContext = 'higher-is-better',
): 'positive' | 'negative' | 'neutral' {
  if (direction === 'flat' || context === 'neutral') return 'neutral';
  const isUp = direction === 'up';
  const good = context === 'higher-is-better' ? isUp : !isUp;
  return good ? 'positive' : 'negative';
}

const TONE_CLASS = {
  positive: 'text-status-healthy',
  negative: 'text-status-critical',
  neutral: 'text-slate-400',
} as const;

export function TrendArrow({
  direction,
  context = 'higher-is-better',
  value,
  className,
}: TrendArrowProps) {
  const tone = resolveTrendTone(direction, context);

  return (
    <span className={cn('inline-flex items-center gap-1 text-xs font-medium', TONE_CLASS[tone], className)}>
      <span aria-hidden="true" className="leading-none">
        {direction === 'up' ? '▲' : direction === 'down' ? '▼' : '■'}
      </span>
      {value ? <span>{value}</span> : null}
    </span>
  );
}
