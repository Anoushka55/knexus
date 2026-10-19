'use client';

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';

import { CardAction, DashboardCard } from '@/lib/engineering-observability/shared/DashboardCard';
import { overview } from '@/lib/engineering-observability/data/overview';

const { mttr } = overview;
const AXIS_TICK = { fill: '#94A3B8', fontSize: 11 };

export function MttrCard() {
  const improved = mttr.deltaMinutes < 0;

  return (
    <DashboardCard title="MTTR (Mean Time To Resolve)" action={<CardAction>View trends</CardAction>}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[30px] font-bold leading-none text-slate-900">
            {mttr.currentMinutes}m
          </p>
          <p className="mt-1.5 text-[12px] text-slate-500">Current MTTR</p>
          <p
            className={`mt-1.5 text-[12px] font-semibold ${
              improved ? 'text-status-healthy' : 'text-status-critical'
            }`}
          >
            <span aria-hidden="true" className="mr-0.5 text-[9px]">
              {improved ? '▼' : '▲'}
            </span>
            {Math.abs(mttr.deltaMinutes)}m
            <span className="ml-1 font-normal text-slate-400">vs yesterday</span>
          </p>
        </div>

        <div className="pt-1 text-left">
          <p className="text-[12px] text-slate-500">Target</p>
          <p className="mt-1 text-[26px] font-bold leading-none text-slate-900">
            {mttr.targetMinutes}m
          </p>
        </div>

        <div className="pt-1 text-left">
          <p className="text-[12px] text-slate-500">Gap</p>
          <p className="mt-1 text-[26px] font-bold leading-none text-status-critical">
            +{mttr.gapMinutes}m
          </p>
        </div>
      </div>

      <div className="mt-3 h-[112px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={mttr.series} margin={{ top: 6, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid stroke="#F1F5F9" vertical={false} />
            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={AXIS_TICK} dy={6} />
            <YAxis
              domain={[0, 60]}
              ticks={[0, 30, 60]}
              tickFormatter={(value: number) => `${value}m`}
              axisLine={false}
              tickLine={false}
              tick={AXIS_TICK}
              width={36}
            />
            {/* The target line the trend is being judged against */}
            <ReferenceLine
              y={mttr.targetMinutes}
              stroke="#94A3B8"
              strokeDasharray="4 4"
              strokeWidth={1}
            />
            <Line
              type="linear"
              dataKey="value"
              stroke="#1E40AF"
              strokeWidth={2}
              dot={{ r: 3, fill: '#FFFFFF', stroke: '#1E40AF', strokeWidth: 2 }}
              activeDot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </DashboardCard>
  );
}
