import { cn } from "@/lib/utils";

export function KpiTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="text-xs font-medium text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-slate-900">{value}</div>
      {hint && <div className="mt-1 text-xs text-slate-400">{hint}</div>}
    </div>
  );
}

export function SectionCard({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-xl border border-slate-200 bg-white p-5", className)}>
      <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
      {description && <p className="mt-1 text-xs text-slate-500">{description}</p>}
      <div className="mt-4">{children}</div>
    </div>
  );
}

const toneClasses: Record<string, string> = {
  neutral: "bg-slate-100 text-slate-600",
  blue: "bg-blue-50 text-blue-700",
  green: "bg-green-50 text-green-700",
  amber: "bg-amber-50 text-amber-700",
  red: "bg-red-50 text-red-700",
};

export function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "blue" | "green" | "amber" | "red";
}) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium", toneClasses[tone])}>
      {children}
    </span>
  );
}

function priorityTone(value: string): "neutral" | "blue" | "green" | "amber" | "red" {
  const v = value.toLowerCase();
  if (["critical", "high", "p1"].includes(v)) return "red";
  if (["medium", "p3", "in progress", "in review", "drafting", "partial", "gap", "scheduled"].includes(v)) return "amber";
  if (["low", "p4", "complete", "resolved", "approved", "compliant", "none"].includes(v)) return "green";
  return "neutral";
}

export function DataTable({ columns, rows }: { columns: string[]; rows: Record<string, string>[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 text-left">
            {columns.map((col) => (
              <th key={col} className="px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-slate-500">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className={i !== rows.length - 1 ? "border-b border-slate-100" : ""}>
              {columns.map((col) => {
                const value = row[col] ?? "";
                const isBadgeColumn = /status|priority|urgency|risk\b|compliance|automation score/i.test(col);
                return (
                  <td key={col} className="px-4 py-3 text-slate-700">
                    {isBadgeColumn ? <Badge tone={priorityTone(value)}>{value}</Badge> : value}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
