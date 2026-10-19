'use client';

import { Settings2 } from 'lucide-react';
import { useState } from 'react';

import { lastUpdatedTime } from '@/lib/engineering-observability/data/user';
import { cn } from '@/lib/engineering-observability/utils';

export function PageToolbar() {
  const [autoRefresh, setAutoRefresh] = useState(true);

  return (
    <div className="flex items-center justify-end gap-4">
      <div className="flex items-center gap-2.5">
        <span className="text-[13px] font-medium text-slate-600">Auto-refresh</span>
        <button
          type="button"
          role="switch"
          aria-checked={autoRefresh}
          aria-label="Auto-refresh"
          onClick={() => setAutoRefresh((value) => !value)}
          className={cn(
            'relative h-[22px] w-[42px] shrink-0 rounded-full transition-colors',
            autoRefresh ? 'bg-kpmg-blue-mid' : 'bg-slate-300',
          )}
        >
          <span
            className={cn(
              'absolute top-[3px] h-4 w-4 rounded-full bg-white shadow-sm transition-[left]',
              autoRefresh ? 'left-[23px]' : 'left-[3px]',
            )}
          />
        </button>
      </div>

      <span className="text-[13px] text-slate-500">Last updated: {lastUpdatedTime}</span>

      <button
        type="button"
        className="inline-flex h-8 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-[13px] font-medium text-slate-600 transition-colors hover:bg-slate-50"
      >
        <Settings2 className="h-4 w-4 text-kpmg-blue-mid" strokeWidth={2} />
        Customize
      </button>
    </div>
  );
}
