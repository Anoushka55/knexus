'use client';

import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';

import { cn } from '@/lib/engineering-observability/utils';

export interface MiniDonutDatum {
  name: string;
  value: number;
  color: string;
}

export interface MiniDonutProps {
  data: MiniDonutDatum[];
  centerLabel: string;
  centerValue: string;
  size?: number;
  className?: string;
}

export function MiniDonut({
  data,
  centerLabel,
  centerValue,
  size = 176,
  className,
}: MiniDonutProps) {
  return (
    <div className={cn('relative', className)} style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius="66%"
            outerRadius="100%"
            paddingAngle={2}
            stroke="none"
            isAnimationActive={false}
          >
            {data.map((datum) => (
              <Cell key={datum.name} fill={datum.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-semibold text-slate-900">{centerValue}</span>
        <span className="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-slate-500">
          {centerLabel}
        </span>
      </div>
    </div>
  );
}
