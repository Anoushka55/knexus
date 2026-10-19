"use client";

export function Card({
  title,
  subtitle,
  action,
  children,
  className = "",
}: {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`bg-surface border border-border rounded-ea-md ${className}`}>
      {(title || action) && (
        <header className="flex items-center justify-between px-4 h-11 border-b border-border">
          <div className="flex items-center gap-2 min-w-0">
            <h3 className="text-[13px] font-semibold text-foreground truncate">{title}</h3>
            {subtitle && <span className="text-xs text-muted-foreground truncate">{subtitle}</span>}
          </div>
          {action}
        </header>
      )}
      <div className="p-4">{children}</div>
    </section>
  );
}

export function Pill({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
  tone?: "default" | "navy" | "teal" | "crimson" | "amber" | "blue" | "muted" | "success";
}) {
  const map = {
    default: "bg-background text-foreground border-border",
    navy: "bg-navy text-white border-navy",
    teal: "bg-teal/10 text-teal border-teal/30",
    crimson: "bg-crimson/10 text-crimson border-crimson/30",
    amber: "bg-amber/10 text-amber border-amber/30",
    blue: "bg-blue/10 text-blue border-blue/30",
    muted: "bg-background text-muted-foreground border-border",
    success: "bg-success/10 text-success border-success/30",
  } as const;
  return (
    <span
      className={`inline-flex items-center h-5 px-2 text-[10px] font-medium uppercase tracking-wide rounded-ea-sm border ${map[tone]}`}
    >
      {children}
    </span>
  );
}

export function StatTile({
  label,
  value,
  sub,
  tone = "default",
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  tone?: "default" | "success" | "amber" | "crimson";
}) {
  const toneClass = {
    default: "text-foreground",
    success: "text-success",
    amber: "text-amber",
    crimson: "text-crimson",
  } as const;
  return (
    <div className="bg-surface border border-border rounded-ea-md p-4">
      <div className={`text-2xl font-bold tabular-nums ${toneClass[tone]}`}>{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
      {sub && <div className="text-[11px] text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  );
}

export function ActionBadge({ action }: { action?: string }) {
  const tone: Record<string, "success" | "blue" | "amber" | "crimson" | "default"> = {
    Retain: "success",
    Rehost: "blue",
    Replatform: "blue",
    Refactor: "amber",
    Replace: "amber",
    Retire: "crimson",
  };
  return <Pill tone={tone[action ?? ""] ?? "default"}>{action ?? "—"}</Pill>;
}

export function BandPill({ band }: { band?: string }) {
  const tone: Record<string, "success" | "amber" | "crimson" | "default"> = {
    High: "success",
    Medium: "amber",
    Low: "crimson",
  };
  return <Pill tone={tone[band ?? ""] ?? "default"}>{band ?? "N/A"}</Pill>;
}

export function RiskPill({ level }: { level?: string }) {
  const tone: Record<string, "success" | "amber" | "crimson" | "default"> = {
    LOW: "success",
    MEDIUM: "amber",
    HIGH: "crimson",
    CRITICAL: "crimson",
  };
  return <Pill tone={tone[(level ?? "").toUpperCase()] ?? "default"}>{level ?? "UNKNOWN"}</Pill>;
}

export function ProgressBar({ value, max = 100, color = "var(--blue)" }: { value: number; max?: number; color?: string }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className="h-1.5 bg-border rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

export function Spinner({ className = "" }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none" width={16} height={16}>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
      <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function EmptyState({ icon, title, body }: { icon?: React.ReactNode; title: string; body?: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6 text-muted-foreground">
      {icon && <div className="mb-3 opacity-60">{icon}</div>}
      <div className="text-sm font-medium text-foreground">{title}</div>
      {body && <div className="text-xs mt-1 max-w-sm">{body}</div>}
    </div>
  );
}
