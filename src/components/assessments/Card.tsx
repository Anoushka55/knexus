import Link from "next/link";
import { cn } from "@/lib/utils";

/** The panel chrome every results section sits in. */
export function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-slate-200 bg-white p-5 shadow-card print:break-inside-avoid print:shadow-none",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function Panel({
  title,
  icon,
  action,
  className,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  action?: { href: string; label: string };
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className={className}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-sm font-bold tracking-tight text-slate-900">
          {icon}
          {title}
        </h2>
        {action && (
          <Link
            href={action.href}
            className="flex-shrink-0 text-xs font-semibold text-brand-blue hover:underline print:hidden"
          >
            {action.label}
          </Link>
        )}
      </div>
      {children}
    </Card>
  );
}
