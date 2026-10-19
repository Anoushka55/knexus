import { cn } from "../utils";
import { ReactNode } from "react";

export type BadgeVariant = "success" | "warning" | "critical" | "info" | "navy" | "coral" | "teal" | "neutral";

const variantClasses: Record<BadgeVariant, string> = {
  success: "bg-success/10 text-success border-success/20",
  warning: "bg-warning/10 text-warning border-warning/30",
  critical: "bg-critical/10 text-critical border-critical/20",
  info: "bg-info/10 text-info border-info/20",
  navy: "bg-navy/10 text-navy border-navy/20",
  coral: "bg-coral/10 text-coral border-coral/20",
  teal: "bg-teal/10 text-teal border-teal/20",
  neutral: "bg-muted/10 text-muted border-muted/20",
};

export function Badge({
  variant = "neutral",
  children,
  className,
}: { variant?: BadgeVariant; children: ReactNode; className?: string }) {
  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border",
      variantClasses[variant],
      className
    )}>
      {children}
    </span>
  );
}

export function tierToVariant(tier: string): BadgeVariant {
  if (tier === "Director") return "critical";
  if (tier === "L2") return "warning";
  if (tier === "L1") return "info";
  if (tier === "Auto-Close") return "success";
  return "neutral";
}

export function rootCauseToVariant(rc: string): BadgeVariant {
  switch (rc) {
    case "Data Quality": return "navy";
    case "Promo": return "coral";
    case "Seasonality": return "teal";
    case "Supply": return "warning";
    case "Market Event": return "info";
    default: return "neutral";
  }
}
