'use client';

import { ChevronDown } from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceArea,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';

import { DashboardCard } from '@/lib/engineering-observability/shared/DashboardCard';
import { overview } from '@/lib/engineering-observability/data/overview';

const AXIS_TICK = { fill: '#94A3B8', fontSize: 11 };
const trend = overview.engineeringHealthTrend;
const lastIndex = trend.length - 1;

interface DotProps {
  cx?: number;
  cy?: number;
  index?: number;
}

/** Small dots along the line, with the final reading emphasised and labelled. */
function TrendDot({ cx, cy, index }: DotProps) {
  if (cx === undefined || cy === undefined) return null;
  const isLast = index === lastIndex;

  return (
    <g>
      <circle
        cx={cx}
        cy={cy}
        r={isLast ? 4.5 : 3}
        fill="#FFFFFF"
        stroke="#1E40AF"
        strokeWidth={isLast ? 3 : 2}
      />
      {isLast ? (
        <text x={cx + 11} y={cy + 4} fill="#1E40AF" fontSize={13} fontWeight={700}>
          {trend[lastIndex].value}
        </text>
      ) : null}
    </g>
  );
}

export function HealthTrendCard() {
  return (
    <DashboardCard
      title="Engineering Health Trend"
      action={
        <button
          type="button"
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-[12px] font-medium text-slate-600 transition-colors hover:bg-slate-50"
        >
          7 Days
          <ChevronDown className="h-3.5 w-3.5 text-slate-400" strokeWidth={2} />
        </button>
      }
    >
      <div className="h-[176px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={trend} margin={{ top: 8, right: 34, bottom: 0, left: -18 }}>
            <defs>
              <linearGradient id="healthTrendFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1E40AF" stopOpacity={0.16} />
                <stop offset="100%" stopColor="#1E40AF" stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#F1F5F9" vertical={false} />
            {/* Highlights the most recent day of the window */}
            <ReferenceArea x1="May 7" x2="May 8" fill="#1E40AF" fillOpacity={0.04} />
            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={AXIS_TICK} dy={6} />
            <YAxis
              domain={[0, 100]}
              ticks={[0, 20, 40, 60, 80, 100]}
              axisLine={false}
              tickLine={false}
              tick={AXIS_TICK}
              width={44}
            />
            <Area
              type="linear"
              dataKey="value"
              stroke="#1E40AF"
              strokeWidth={2}
              fill="url(#healthTrendFill)"
              dot={<TrendDot />}
              activeDot={false}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </DashboardCard>
  );
}
