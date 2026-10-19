import type { CrmWrite } from '@/lib/kpmg-dice/lib/agents'
import type { Lead, Payment, ServiceTicket } from '@/lib/kpmg-dice/types'

/** An action the copilot offers; nothing is written until the user clicks. */
export interface CopilotAction {
  id: string
  label: string
  /** What will land in Salesforce, shown before the click. */
  crmEffect: string
  write: CrmWrite
  icon: 'task' | 'flag' | 'message' | 'suppress' | 'callback'
}

export type CopilotAttachment =
  | { kind: 'lead-card'; lead: Lead; reason: string; action: string }
  | {
      kind: 'lead-list'
      title: string
      leads: { lead: Lead; note: string }[]
    }
  | {
      kind: 'draft'
      channel: 'whatsapp' | 'email' | 'sms'
      subject?: string
      body: string
      recipient: string
    }
  | {
      kind: 'payment-schedule'
      lead: Lead
      rows: Payment[]
      totalCr: number
      paidCr: number
      overdueCr: number
    }
  | {
      kind: 'kpi-summary'
      figures: { label: string; value: string; danger?: boolean }[]
    }
  | {
      kind: 'ticket-list'
      tickets: {
        ticket: ServiceTicket
        slaDays: number
        summary: string
        resolution: string
        owner: string
      }[]
    }

export interface CopilotMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
  attachment?: CopilotAttachment
  actions?: CopilotAction[]
  /** Results of any action executed from this message. */
  executed?: string[]
  /** Ids of actions already committed, so only those show as done. */
  executedActionIds?: string[]
  pending?: boolean
}

export interface CopilotReply {
  text: string
  attachment?: CopilotAttachment
  actions?: CopilotAction[]
}
