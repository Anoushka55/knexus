'use client'

import { useMemo } from 'react'

import { useSettingsStore } from '@/lib/kpmg-dice/store/settings-store'
import { getAIService } from './index'

/** Resolves the AI service for the currently selected mode. */
export function useAIService() {
  const aiMode = useSettingsStore((s) => s.aiMode)
  return useMemo(() => getAIService(aiMode), [aiMode])
}
