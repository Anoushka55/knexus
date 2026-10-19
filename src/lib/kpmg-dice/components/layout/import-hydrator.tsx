'use client'

import { useEffect } from 'react'

import { useCrmStore } from '@/lib/kpmg-dice/store/crm-store'

/**
 * Restores a previous CSV import after a reload.
 *
 * Deliberately an effect rather than part of store creation. The store's own
 * premise is that the server and the browser render identical state; reading
 * IndexedDB during render, in `seedState`, or in a `useState` initialiser would
 * hand the client rows the server's HTML does not have, and React would report
 * a hydration mismatch on every route and re-render the whole tree to recover.
 *
 * The cost of doing it here is one frame showing the seeded figures before they
 * tick up. That is the right trade: a brief flicker beats a hydration error, and
 * gating first paint on a mounted flag would blank every route instead.
 */

/** Fast Refresh remounts this; the merge must not run twice. */
let started = false

export function ImportHydrator() {
  const rehydrateImports = useCrmStore((s) => s.rehydrateImports)

  useEffect(() => {
    if (started) return
    started = true
    void rehydrateImports()
  }, [rehydrateImports])

  return null
}
