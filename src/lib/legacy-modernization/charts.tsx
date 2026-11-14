"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { cn } from "@/lib/utils";

const axis = {
  stroke: "var(--muted-foreground)",
  fontSize: 11,
  tickLine: false,
  axisLine: false,
};

const tooltipStyle = {
  contentStyle: {
    borderRadius: 10,
    border: "1px solid var(--border)",
    background: "var(--card)",
    fontSize: 12,
    boxShadow: "var(--shadow-panel)",
  },
  labelStyle: { color: "var(--foreground)", fontWeight: 600 },
};

export type Slice = { name: string; value: number; color: string; display?: string; share?: string };

export function DonutStat({
  data,
  total,
  totalLabel,
  height = 210,
  legend = true,
  innerRadius = 58,
  outerRadius = 84,
}: {
  data: Slice[];
  total: string;
  totalLabel: string;
  height?: number;
  legend?: boolean;
  innerRadius?: number;
  outerRadius?: number;
}) {
  const sum = data.reduce((a, b) => a + b.value, 0) || 1;
  return (
    <div className={cn("flex items-center gap-5", legend ? "flex-wrap" : "justify-center")}>

      <div className="relative shrink-0" style={{ width: outerRadius * 2 + 8, height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              innerRadius={innerRadius}
              outerRadius={outerRadius}
              paddingAngle={1}
              stroke="var(--card)"
              strokeWidth={2}
            >
              {data.map((d) => (
                <Cell key={d.name} fill={d.color} />
              ))}
            </Pie>
            <Tooltip {...tooltipStyle} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="num text-xl font-semibold text-foreground">{total}</span>
          <span className="text-[11px] text-muted-foreground">{totalLabel}</span>
        </div>
      </div>
      {legend ? (
        <ul className="min-w-[9.5rem] flex-1 space-y-2.5">
          {data.map((d) => (
            <li key={d.name} className="flex items-center gap-2 text-xs">
              <span className="size-2 shrink-0 rounded-full" style={{ background: d.color }} />
              <span className="min-w-0 flex-1 truncate text-foreground">{d.name}</span>
              <span className="num font-semibold text-foreground">{d.display ?? d.value.toLocaleString()}</span>
              <span className="num w-11 text-right text-muted-foreground">
                {d.share ?? `${Math.round((d.value / sum) * 100)}%`}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function TrendLine({
  data,
  series,
  height = 200,
  domain,
  showLegend = false,
}: {
  data: Array<Record<string, number | string>>;
  series: Array<{ key: string; name: string; color: string }>;
  height?: number;
  domain?: [number, number];
  showLegend?: boolean;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="label" {...axis} />
        <YAxis {...axis} domain={domain ?? [0, "auto"]} />
        <Tooltip {...tooltipStyle} />
        {showLegend ? <Legend iconType="plainline" wrapperStyle={{ fontSize: 11 }} /> : null}
        {series.map((s) => (
          <Line
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.name}
            stroke={s.color}
            strokeWidth={2}
            dot={{ r: 2.5, strokeWidth: 0, fill: s.color }}
            activeDot={{ r: 4 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

export function Sparkline({ data, color }: { data: number[]; color: string }) {
  const shaped = data.map((v, i) => ({ i, v }));
  return (
    <ResponsiveContainer width="100%" height={56}>
      <AreaChart data={shaped} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={`spark-${color.replace(/\W/g, "")}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.28} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="v"
          stroke={color}
          strokeWidth={1.8}
          fill={`url(#spark-${color.replace(/\W/g, "")})`}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function RadarScore({
  data,
  height = 260,
}: {
  data: Array<{ dimension: string; current: number; target: number }>;
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RadarChart data={data} outerRadius="72%">
        <PolarGrid stroke="var(--border)" />
        <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
        <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 9, fill: "var(--muted-foreground)" }} />
        <Radar
          name="Current Score"
          dataKey="current"
          stroke="var(--brand)"
          fill="var(--brand)"
          fillOpacity={0.18}
          strokeWidth={2}
        />
        <Radar
          name="Target Score"
          dataKey="target"
          stroke="var(--muted-foreground)"
          fill="none"
          strokeDasharray="4 4"
        />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Tooltip {...tooltipStyle} />
      </RadarChart>
    </ResponsiveContainer>
  );
}

export function BarList({
  items,
  color = "var(--intel)",
}: {
  items: Array<{ label: string; value: number; display?: string; share?: string }>;
  color?: string;
}) {
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.label} className="grid grid-cols-[minmax(0,9rem)_1fr_auto] items-center gap-3 text-xs">
          <span className="truncate text-foreground">{item.label}</span>
          <span className="h-2.5 w-full overflow-hidden rounded-full bg-secondary">
            <span
              className="block h-full rounded-full"
              style={{ width: `${(item.value / max) * 100}%`, background: color }}
            />
          </span>
          <span className="num w-20 text-right text-muted-foreground">
            <span className="font-semibold text-foreground">{item.display ?? item.value}</span>
            {item.share ? ` (${item.share})` : ""}
          </span>
        </li>
      ))}
    </ul>
  );
}
