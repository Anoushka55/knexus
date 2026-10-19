'use client';

import { useId } from 'react';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';

export type SparklineTone = 'red' | 'green' | 'blue' | 'purple' | 'orange';

const TONE_COLOR: Record<SparklineTone, string> = {
  red: '#DC2626',
  green: '#16A34A',
  blue: '#1E40AF',
  purple: '#7C3AED',
  orange: '#EA580C',
};

export interface SparklineProps {
  data: number[];
  tone?: SparklineTone;
  height?: number;
  className?: string;
}

export function Sparkline({ data, tone = 'blue', height = 40, className }: SparklineProps) {
  const gradientId = useId().replace(/:/g, '');
  const color = TONE_COLOR[tone];
  const points = data.map((value, index) => ({ index, value }));

  return (
    <div className={className} style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.28} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
