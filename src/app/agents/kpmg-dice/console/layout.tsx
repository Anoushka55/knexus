import type { ReactNode } from 'react'

import { AppShell } from '@/lib/kpmg-dice/components/layout/app-shell'
import './kpmg-dice-theme.css'

/**
 * Console root layout for the KPMG DICE — Customer Journey Command Center
 * agent, ported in full from the standalone app at
 * src/app/agents/kpmg-dice/console/* (see the sibling route folders).
 *
 * Follows the same shape as the aiops-sentry console layout: a scoped theme
 * class (`kpmg-dice-theme`, from `./kpmg-dice-theme.css`) so none of this
 * agent's styling bleeds into the rest of the marketplace, wrapping a
 * client-side app shell.
 *
 * Unlike aiops-sentry's layout (which rebuilt a compact rail + header from
 * scratch), DICE's own AppShell — collapsible grouped sidebar, header with
 * global search/notifications/role switcher, the presenter "Demo" menu, and
 * the role-based access guard — is ported wholesale from
 * src/lib/kpmg-dice/components/layout/app-shell.tsx, since it is the richer
 * of the two and the source app's own nav grouping/icons/labels
 * (src/lib/kpmg-dice/config/nav.ts) are preserved exactly.
 */
export default function KpmgDiceConsoleLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <div className="kpmg-dice-theme">
      <AppShell>{children}</AppShell>
    </div>
  )
}
