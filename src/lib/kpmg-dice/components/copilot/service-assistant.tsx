'use client'

import { ChatShell } from './chat-shell'
import {
  SERVICE_PROMPT_CHIPS,
  resolveServiceQuery,
} from '@/lib/kpmg-dice/lib/copilot/service-copilot'

export function ServiceAssistant() {
  return (
    <ChatShell
      title="Service Assistant"
      subtitle="Summarises open tickets, scores SLA risk, and recommends a resolution and an owner."
      greeting="I watch every open post-sales ticket against its SLA. Ask me what has breached, what is about to, or about a specific customer — and I can assign the resolution task."
      chips={SERVICE_PROMPT_CHIPS}
      resolve={resolveServiceQuery}
      accent="text-kpmg-magenta"
    />
  )
}
