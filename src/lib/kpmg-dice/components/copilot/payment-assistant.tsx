'use client'

import { ChatShell } from './chat-shell'
import {
  PAYMENT_PROMPT_CHIPS,
  resolvePaymentQuery,
} from '@/lib/kpmg-dice/lib/copilot/payment-copilot'

export function PaymentAssistant() {
  return (
    <ChatShell
      title="Payment Assistant"
      subtitle="Pulls the payment plan, drafts the finance callback, and logs the query against the lead."
      greeting="I can pull a payment schedule for any customer, show who has an unanswered payment question, and raise the finance callback. Which customer shall I start with?"
      chips={PAYMENT_PROMPT_CHIPS}
      resolve={resolvePaymentQuery}
      accent="text-kpmg-teal"
    />
  )
}
