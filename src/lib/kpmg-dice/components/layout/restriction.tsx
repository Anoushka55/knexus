'use client'

import { Lock, ShieldAlert } from 'lucide-react'

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/lib/kpmg-dice/components/ui/dialog'
import { Button } from '@/lib/kpmg-dice/components/ui/button'
import {
  ROLES_BY_ID,
  canAccess,
  describeRoles,
  rolesFor,
  type RoleId,
} from '@/lib/kpmg-dice/config/roles'
import { useUIStore } from '@/lib/kpmg-dice/store/ui-store'

/**
 * What a seat is not allowed to open, and why.
 *
 * The dialog and the full-screen guard share one message builder on purpose:
 * a restriction that says something different depending on where you met it
 * reads as a bug rather than as a policy.
 *
 * The wording always names the seats that *can* open it. "Requires special
 * access" tells the reader nothing and is exactly the kind of dead end this is
 * meant to replace.
 */

export function useActiveRole() {
  const activeRoleId = useUIStore((s) => s.activeRoleId)
  return ROLES_BY_ID[activeRoleId]
}

export function useCanAccess(href: string) {
  const activeRoleId = useUIStore((s) => s.activeRoleId)
  return canAccess(href, activeRoleId)
}

function message(href: string, label: string, activeRoleId: RoleId) {
  const allowed = rolesFor(href)
  return {
    headline: `${label} is restricted`,
    body: `Open to ${describeRoles(allowed)}. You are signed in as ${
      ROLES_BY_ID[activeRoleId].role
    }, so this screen is not part of your access.`,
  }
}

/** Short form, for a tooltip on hover. */
export function useRestrictionHint(href: string, label: string) {
  const activeRoleId = useUIStore((s) => s.activeRoleId)
  return `${label} — open to ${describeRoles(rolesFor(href))}`
}

export function RestrictionDialog({
  href,
  label,
  open,
  onOpenChange,
}: {
  href: string
  label: string
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const activeRoleId = useUIStore((s) => s.activeRoleId)
  const { headline, body } = message(href, label, activeRoleId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <Lock className="size-[18px]" strokeWidth={2.1} />
          </span>
          <div className="min-w-0">
            <DialogTitle>{headline}</DialogTitle>
            <DialogDescription className="mt-1.5">{body}</DialogDescription>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-3.5">
          <p className="text-[11.5px] text-slate-400">
            Switch seats from the profile menu to see this view.
          </p>
          <DialogClose asChild>
            <Button size="sm" variant="outline">
              Close
            </Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Rendered in place of a page the active seat may not open.
 *
 * This is what makes the model real rather than cosmetic: typing the URL
 * directly lands here, not on the page with its navigation merely hidden.
 */
export function RestrictedScreen({
  href,
  label,
}: {
  href: string
  label: string
}) {
  const activeRoleId = useUIStore((s) => s.activeRoleId)
  const { headline, body } = message(href, label, activeRoleId)
  const allowed = rolesFor(href)

  return (
    <div className="animate-fade-in flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full max-w-[520px] rounded-xl border border-slate-200 bg-white p-6 text-center shadow-card">
        <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
          <ShieldAlert className="size-6" strokeWidth={1.9} />
        </span>

        <h2 className="mt-4 text-[19px] font-bold tracking-[-0.01em] text-slate-900">
          {headline}
        </h2>
        <p className="mx-auto mt-2 max-w-[42ch] text-[13px] leading-relaxed text-slate-500">
          {body}
        </p>

        <div className="mt-5 border-t border-slate-100 pt-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Seats with access
          </p>
          <div className="mt-2 flex flex-wrap justify-center gap-1.5">
            {allowed.map((id) => (
              <span
                key={id}
                className="rounded-full bg-slate-100 px-2.5 py-1 text-[11.5px] font-semibold text-slate-600"
              >
                {ROLES_BY_ID[id].role}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
