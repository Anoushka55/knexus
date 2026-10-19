'use client'

import { ChatShell } from './chat-shell'
import {
  SALES_PROMPT_CHIPS,
  resolveSalesQuery,
} from '@/lib/kpmg-dice/lib/copilot/sales-copilot'
import { CURRENT_USER } from '@/lib/kpmg-dice/config/brand'

export function SalesCopilot() {
  return (
    <ChatShell
      title="Sales Copilot"
      subtitle="Grounded in your live pipeline — it can draft, schedule and flag, not just answer."
      greeting={`Morning ${CURRENT_USER.name.split(' ')[0]}. Ask me about any lead by name, and I can draft the outreach or raise the task straight into Salesforce. What are we working on?`}
      chips={SALES_PROMPT_CHIPS}
      resolve={resolveSalesQuery}
    />
  )
}
