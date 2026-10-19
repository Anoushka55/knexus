import { LiveAIService } from './live-ai-service'
import { MockAIService } from './mock-ai-service'
import type { AIMode, AIService } from './types'

export * from './types'
export { MockAIService } from './mock-ai-service'
export { LiveAIService } from './live-ai-service'

const instances: Partial<Record<AIMode, AIService>> = {}

/**
 * Resolve the active AI service.
 *
 * Both implementations satisfy the same interface, so every feature works
 * identically in either mode. Live routes through /api/ai (server-held key) and
 * degrades to the mock per-call on any failure — the app never needs a key.
 */
export function getAIService(mode: AIMode = 'mock'): AIService {
  if (!instances[mode]) {
    instances[mode] = mode === 'live' ? new LiveAIService() : new MockAIService()
  }
  return instances[mode]!
}
