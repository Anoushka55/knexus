'use client'

import { create } from 'zustand'

import type { AIMode } from '@/lib/kpmg-dice/lib/ai'

/**
 * Where the numbers on screen come from.
 *
 * Both sources are demonstration data. Switching regenerates the feedback book
 * from a different seed so every figure changes coherently, which is what makes
 * the control worth having in a walkthrough. A persistent notice says so on
 * screen, because a source labelled "client" that silently showed synthetic
 * figures would be the one thing this control must never do.
 */
export type DataSource = 'example' | 'client'

interface SettingsState {
  dataSource: DataSource
  setDataSource: (source: DataSource) => void
  aiMode: AIMode
  /** Whether the server reports an ANTHROPIC_API_KEY; null until probed. */
  liveAvailable: boolean | null
  setAiMode: (mode: AIMode) => void
  probeLiveAvailability: () => Promise<void>
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  dataSource: 'example',

  setDataSource: (dataSource) => set({ dataSource }),

  aiMode: 'mock',
  liveAvailable: null,

  // Live is always selectable. Without a server key the live service falls back
  // per call to a simulated response, and the notice on screen says which.
  setAiMode: (aiMode) => set({ aiMode }),

  /**
   * Records whether a real key is present, without gating anything on it.
   * The value only decides the wording of the on-screen notice.
   */
  probeLiveAvailability: async () => {
    if (get().liveAvailable !== null) return
    try {
      const response = await fetch('/agents/kpmg-dice/api/ai')
      const data = (await response.json()) as { available?: boolean }
      set({ liveAvailable: Boolean(data.available) })
    } catch {
      set({ liveAvailable: false })
    }
  },
}))
