'use client'

import { useCrmStore } from '@/lib/kpmg-dice/store/crm-store'
import { ref, type ReferenceSets } from './active-reference'

/**
 * The reference sets, for components.
 *
 * `ref()` on its own is not reactive — it reads a module variable, and React has
 * no way to know it changed. Subscribing to the version counter is what makes a
 * component re-render when an import swaps the sets.
 *
 * Any screen that renders projects, reps, campaigns, personas or themes must go
 * through this rather than calling `ref()` directly. Calling `ref()` in a
 * component compiles, renders correctly, and then silently keeps showing the
 * previous client's names after a switch — which is the whole failure this hook
 * exists to prevent.
 */
export function useReference(): ReferenceSets {
  useCrmStore((s) => s.referenceVersion)
  return ref()
}
