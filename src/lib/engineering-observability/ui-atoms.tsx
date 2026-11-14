import type { ReactNode } from "react";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import { cn } from "@/lib/engineering-observability/utils";
import type { HealthStatus, Severity } from "@/lib/engineering-observability/types";

export function Card({
  title,
  subtitle,
  action,
  children,
  className,
  bodyClassName,
}: {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cn("rounded-lg border border-border bg-card shadow-sm", className)}>
      {(title || action) && (
        <header className="flex items-start justify-between gap-2 border-b border-border px-4 py-3">
          <div>
            {title && <h3 className="text-sm font-semibold text-foreground">{title}</h3>}
            {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          {action}
        </header>
      )}
      <div className={cn("p-4", bodyClassName)}>{children}</div>
    </section>
  );
}

const healthStyles: Record<HealthStatus, string> = {
  healthy: "bg-healthy-soft text-healthy border-[color:color-mix(in_oklab,var(--healthy)_30%,transparent)]",
  degraded: "bg-warning-soft text-warning border-[color:color-mix(in_oklab,var(--warning)_30%,transparent)]",
  critical: "bg-critical-soft text-critical border-[color:color-mix(in_oklab,var(--critical)_30%,transparent)]",
  down: "bg-critical text-critical-soft border-critical",
};

export function StatusPill({ status, label }: { status: HealthStatus; label?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold capitalize",
        healthStyles[status],
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label ?? status}
    </span>
  );
}

const severityStyles: Record<string, string> = {
  P1: "bg-critical-soft text-critical border-[color:color-mix(in_oklab,var(--critical)_30%,transparent)]",
  P2: "bg-warning-soft text-warning border-[color:color-mix(in_oklab,var(--warning)_30%,transparent)]",
  P3: "bg-info-soft text-info border-[color:color-mix(in_oklab,var(--info)_30%,transparent)]",
  P4: "bg-muted text-muted-foreground border-border",
  Info: "bg-muted text-muted-foreground border-border",
  AI: "bg-ai-soft text-ai border-[color:color-mix(in_oklab,var(--ai)_30%,transparent)]",
  Deploy: "bg-kpmg-light text-kpmg-blue border-[color:color-mix(in_oklab,var(--kpmg-blue)_30%,transparent)]",
  Change: "bg-warning-soft text-warning border-[color:color-mix(in_oklab,var(--warning)_30%,transparent)]",
  Anomaly: "bg-ai-soft text-ai border-[color:color-mix(in_oklab,var(--ai)_30%,transparent)]",
  Cost: "bg-warning-soft text-warning border-[color:color-mix(in_oklab,var(--warning)_30%,transparent)]",
  Alert: "bg-critical-soft text-critical border-[color:color-mix(in_oklab,var(--critical)_30%,transparent)]",
};

export function Badge({ kind, label }: { kind: Severity | string; label?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
        severityStyles[kind] ?? severityStyles["Info"],
      )}
    >
      {label ?? kind}
    </span>
  );
}

export function Delta({
  value,
  invert,
  suffix = "%",
}: {
  value: number;
  invert?: boolean;
  suffix?: string;
}) {
  const positive = value > 0;
  const good = invert ? !positive : positive;
  const Icon = value === 0 ? Minus : positive ? TrendingUp : TrendingDown;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs font-semibold",
        value === 0 ? "text-muted-foreground" : good ? "text-healthy" : "text-critical",
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {positive ? "+" : ""}
      {value}
      {suffix}
    </span>
  );
}

export function KpiCard({
  label,
  value,
  sub,
  delta,
  invertDelta,
  icon,
  tone = "default",
}: {
  label: string;
  value: string;
  sub?: string;
  delta?: number;
  invertDelta?: boolean;
  icon?: ReactNode;
  tone?: "default" | "critical" | "warning" | "healthy" | "ai";
}) {
  const tones = {
    default: "border-border",
    critical: "border-[color:color-mix(in_oklab,var(--critical)_40%,transparent)] bg-[color:color-mix(in_oklab,var(--critical-soft)_40%,transparent)]",
    warning: "border-[color:color-mix(in_oklab,var(--warning)_40%,transparent)] bg-[color:color-mix(in_oklab,var(--warning-soft)_40%,transparent)]",
    healthy: "border-[color:color-mix(in_oklab,var(--healthy)_40%,transparent)] bg-[color:color-mix(in_oklab,var(--healthy-soft)_40%,transparent)]",
    ai: "border-[color:color-mix(in_oklab,var(--ai)_40%,transparent)] bg-[color:color-mix(in_oklab,var(--ai-soft)_40%,transparent)]",
  };
  return (
    <div className={cn("rounded-lg border bg-card p-4 shadow-sm", tones[tone])}>
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        {icon}
      </div>
      <div className="mt-2 text-2xl font-bold tracking-tight text-foreground">{value}</div>
      <div className="mt-1 flex items-center gap-2">
        {delta !== undefined && <Delta value={delta} {...(invertDelta ? { invert: true } : {})} />}
        {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
      </div>
    </div>
  );
}

export function ProgressBar({
  value,
  tone = "primary",
  className,
}: {
  value: number;
  tone?: "primary" | "healthy" | "warning" | "critical";
  className?: string;
}) {
  const tones = {
    primary: "bg-primary",
    healthy: "bg-healthy",
    warning: "bg-warning",
    critical: "bg-critical",
  };
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-muted", className)}>
      <div
        className={cn("h-full rounded-full transition-all", tones[tone])}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}
