import { cn } from '@/lib/engineering-observability/utils';

export type StatusTone =
  | 'critical'
  | 'warning'
  | 'healthy'
  | 'info'
  | 'neutral'
  | 'p1'
  | 'p2'
  | 'p3'
  | 'p4'
  | 'high'
  | 'medium'
  | 'low';

export interface StatusPillProps {
  label: string;
  tone: StatusTone;
  className?: string;
}

const RED = 'bg-status-critical/10 text-status-critical';
const ORANGE = 'bg-status-warning/10 text-status-warning';
const YELLOW = 'bg-amber-500/10 text-amber-600';
const BLUE = 'bg-status-info/10 text-status-info';
const GREEN = 'bg-status-healthy/10 text-status-healthy';
const GRAY = 'bg-slate-500/10 text-slate-600';

const TONE_CLASS: Record<StatusTone, string> = {
  critical: RED,
  p1: RED,
  high: RED,
  warning: ORANGE,
  p2: ORANGE,
  medium: ORANGE,
  p3: YELLOW,
  info: BLUE,
  p4: BLUE,
  // "Low" reads green, not blue — a low-priority item is a healthy state.
  low: GREEN,
  healthy: GREEN,
  neutral: GRAY,
};

export function StatusPill({ label, tone, className }: StatusPillProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold leading-5 whitespace-nowrap',
        TONE_CLASS[tone],
        className,
      )}
    >
      {label}
    </span>
  );
}

/** Maps a free-form status/severity string onto a pill tone. */
export function toneFromLabel(label: string): StatusTone {
  const key = label.trim().toLowerCase();
  if (key in TONE_CLASS) return key as StatusTone;
  if (key === 'sev-1' || key === 'at risk' || key === 'at-risk' || key === 'down') return 'critical';
  if (key === 'degraded' || key === 'needs attention') return 'warning';
  if (key === 'good' || key === 'connected' || key === 'resolved') return 'healthy';
  return 'neutral';
}
