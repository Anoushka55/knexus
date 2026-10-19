'use client'

import { useEffect, useState } from 'react'

import { Database } from 'lucide-react'

import { formatDate } from '@/lib/kpmg-dice/lib/format'
import { useSettingsStore } from '@/lib/kpmg-dice/store/settings-store'

/**
 * Rendered after mount so the server and client never disagree on "today"
 * (a date computed during SSR would hydrate mismatched across a midnight
 * boundary or a differing timezone).
 */
export function LastUpdated() {
  const [stamp, setStamp] = useState<string | null>(null)
  const dataSource = useSettingsStore((s) => s.dataSource)

  useEffect(() => {
    setStamp(`${formatDate(new Date())}, 10:30 AM`)
  }, [])

  return (
    <div className="flex h-4 items-center justify-end gap-3">
      {/*
        Shown only once real records are connected, and then never behind a
        menu — a client should be able to see they are looking at their own
        book without the presenter telling them. The example case says nothing:
        a demo of synthetic data does not need a disclaimer in the header.
      */}
      {dataSource !== 'example' ? (
        <span
          title="Connected to client records."
          className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10.5px] font-semibold text-amber-700"
        >
          <Database className="size-3" strokeWidth={2.3} />
          Client data
        </span>
      ) : null}

      <p className="text-right text-xs text-slate-400">
        {stamp ? `Last updated: ${stamp}` : null}
      </p>
    </div>
  )
}
