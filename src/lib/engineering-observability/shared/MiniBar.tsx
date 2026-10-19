'use client';

import { Bar, BarChart, Cell, ResponsiveContainer, XAxis, YAxis } from 'recharts';

export interface MiniBarDatum {
  label: string;
  value: number;
  color?: string;
}

export interface MiniBarProps {
  data: MiniBarDatum[];
  /** default bar colour when a datum has none */
  color?: string;
  height?: number;
  showValues?: boolean;
  className?: string;
}

export function MiniBar({
  data,
  color = '#1E40AF',
  height = 160,
  showValues = true,
  className,
}: MiniBarProps) {
  return (
    <div className={className} style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: showValues ? 18 : 4, right: 4, bottom: 0, left: 4 }}>
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#94A3B8', fontSize: 11 }}
          />
          <YAxis hide domain={[0, 'dataMax']} />
          <Bar
            dataKey="value"
            radius={[4, 4, 0, 0]}
            maxBarSize={44}
            isAnimationActive={false}
            label={
              showValues
                ? { position: 'top', fill: '#64748B', fontSize: 11, fontWeight: 500 }
                : undefined
            }
          >
            {data.map((datum) => (
              <Cell key={datum.label} fill={datum.color ?? color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
