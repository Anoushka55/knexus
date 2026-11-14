"use client";

import Link from "next/link";
import { ArrowRight, ArrowUpRight, Minus, TrendingDown, TrendingUp } from "lucide-react";
import type { ComponentType, ReactNode } from "react";

import { cn } from "@/lib/utils";
import { ltmHref } from "./nav";

export type Tone = "brand" | "intel" | "success" | "warning" | "danger" | "neutral";

const toneBg: Record<Tone, string> = {
  brand: "bg-brand-soft text-brand",
  intel: "bg-intel-soft text-intel",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  neutral: "bg-secondary text-muted-foreground",
};

const toneText: Record<Tone, string> = {
  brand: "text-brand",
  intel: "text-intel",
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
  neutral: "text-muted-foreground",
};

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function KpiCard({
  label,
  value,
  suffix,
  delta,
  deltaLabel,
  direction = "flat",
  tone = "brand",
  icon: Icon,
}: {
  label: string;
  value: string;
  suffix?: string;
  delta?: string;
  deltaLabel?: string;
  direction?: "up" | "down" | "flat";
  tone?: Tone;
  icon?: ComponentType<{ className?: string }>;
}) {
  const DeltaIcon = direction === "up" ? TrendingUp : direction === "down" ? TrendingDown : Minus;
  const deltaTone =
    direction === "up" ? "text-success" : direction === "down" ? "text-danger" : "text-muted-foreground";

  return (
    <div className="panel flex min-w-0 flex-col gap-3 p-4">
      <div className="flex items-start gap-3">
        {Icon ? (
          <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", toneBg[tone])}>
            <Icon className="size-[18px]" />
          </span>
        ) : null}
        <div className="min-w-0">
          <p className="truncate text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
            {label}
          </p>
          <p className="num mt-1 text-xl font-semibold text-foreground">
            {value}
            {suffix ? <span className="ml-1 text-sm font-medium text-muted-foreground">{suffix}</span> : null}
          </p>
        </div>
      </div>
      {delta || deltaLabel ? (
        <div className="flex items-center gap-1.5 text-[11px]">
          <DeltaIcon className={cn("size-3.5", deltaTone)} />
          <span className={cn("num font-semibold", deltaTone)}>{delta}</span>
          <span className="text-muted-foreground">{deltaLabel}</span>
        </div>
      ) : null}
    </div>
  );
}

export function Panel({
  title,
  subtitle,
  actions,
  footer,
  children,
  className,
  bodyClassName,
}: {
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cn("panel flex flex-col", className)}>
      {title ? (
        <header className="flex items-start justify-between gap-3 px-5 pt-4 pb-3">
          <div>
            <h2 className="text-[15px] font-semibold text-foreground">{title}</h2>
            {subtitle ? <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p> : null}
          </div>
          {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
        </header>
      ) : null}
      <div className={cn("flex-1 px-5 pb-4", !title && "pt-4", bodyClassName)}>{children}</div>
      {footer ? <div className="border-t px-5 py-3">{footer}</div> : null}
    </section>
  );
}

export function PanelLink({ to, children }: { to?: string; children: ReactNode }) {
  const cls =
    "inline-flex items-center gap-1.5 text-xs font-semibold text-brand transition-colors hover:text-brand-bright";
  if (to) {
    return (
      <Link href={ltmHref(to)} className={cls}>
        {children}
        <ArrowRight className="size-3.5" />
      </Link>
    );
  }
  return (
    <button type="button" className={cls}>
      {children}
      <ArrowRight className="size-3.5" />
    </button>
  );
}

export function StatusPill({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap",
        toneBg[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Dot({ tone }: { tone: Tone }) {
  const map: Record<Tone, string> = {
    brand: "bg-brand",
    intel: "bg-intel",
    success: "bg-success",
    warning: "bg-warning",
    danger: "bg-danger",
    neutral: "bg-[color:color-mix(in_oklch,var(--muted-foreground)_50%,transparent)]",
  };
  return <span className={cn("size-2 shrink-0 rounded-full", map[tone])} />;
}

export function TrendArrow({ value, direction }: { value: string; direction: "up" | "down" | "flat" }) {
  const Icon = direction === "up" ? ArrowUpRight : direction === "down" ? TrendingDown : Minus;
  const tone = direction === "up" ? "text-success" : direction === "down" ? "text-danger" : "text-muted-foreground";
  return (
    <span className={cn("num inline-flex items-center gap-1 text-xs font-semibold", tone)}>
      <Icon className="size-3.5" />
      {value}
    </span>
  );
}

export function ProgressBar({ value, tone = "brand" }: { value: number; tone?: Tone }) {
  const map: Record<Tone, string> = {
    brand: "bg-brand",
    intel: "bg-intel",
    success: "bg-success",
    warning: "bg-warning",
    danger: "bg-danger",
    neutral: "bg-muted-foreground",
  };
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
      <div className={cn("h-full rounded-full transition-all", map[tone])} style={{ width: `${value}%` }} />
    </div>
  );
}

export function ScorePill({ score }: { score: number }) {
  const tone: Tone = score >= 70 ? "success" : score >= 50 ? "warning" : "danger";
  return <StatusPill tone={tone}>{score}/100</StatusPill>;
}

export function InsightBar({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[color:color-mix(in_oklch,var(--brand)_15%,transparent)] bg-brand-soft px-4 py-3">
      <p className="text-sm text-foreground">
        <span className="font-semibold">AI Insight: </span>
        {children}
      </p>
      {action}
    </div>
  );
}

export { toneText };
