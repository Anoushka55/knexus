'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronsLeft, Lock } from 'lucide-react'

import { KpmgLogo } from './kpmg-logo'
import {
  NAV_GROUPS,
  isNavEntryActive,
  PINNED_NAV,
  isNavItemActive,
  type NavItem,
} from '@/lib/kpmg-dice/config/nav'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/lib/kpmg-dice/components/ui/tooltip'
import { useUIStore } from '@/lib/kpmg-dice/store/ui-store'
import {
  RestrictionDialog,
  useCanAccess,
  useRestrictionHint,
} from './restriction'
import { cn } from '@/lib/kpmg-dice/lib/utils'

function NavLink({
  item,
  active,
  collapsed,
}: {
  item: NavItem
  active: boolean
  collapsed: boolean
}) {
  const Icon = item.icon
  const allowed = useCanAccess(item.href)
  const hint = useRestrictionHint(item.href, item.label)
  const [showRestriction, setShowRestriction] = useState(false)

  /*
   * Locked rows stay visible. Hiding them would teach a client nothing about
   * the access model; a lock that explains itself demonstrates it.
   */
  if (!allowed) {
    const locked = (
      <button
        type="button"
        onClick={() => setShowRestriction(true)}
        aria-label={hint}
        className={cn(
          'group relative flex w-full items-center gap-3 rounded-lg py-2 text-[13.5px] font-medium transition-colors',
          collapsed ? 'justify-center px-0' : 'px-3',
          'text-white/30 hover:bg-white/[0.05] hover:text-white/50',
        )}
      >
        <Icon className="size-[18px] shrink-0" strokeWidth={1.9} />
        {!collapsed && (
          <>
            <span className="truncate">{item.label}</span>
            <Lock className="ml-auto size-3.5 shrink-0" strokeWidth={2.2} />
          </>
        )}
      </button>
    )

    return (
      <>
        <Tooltip>
          <TooltipTrigger asChild>{locked}</TooltipTrigger>
          <TooltipContent side="right">{hint}</TooltipContent>
        </Tooltip>
        <RestrictionDialog
          href={item.href}
          label={item.label}
          open={showRestriction}
          onOpenChange={setShowRestriction}
        />
      </>
    )
  }

  const link = (
    <Link
      href={item.href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'group relative flex items-center gap-3 rounded-lg py-2 text-[13.5px] font-medium transition-colors',
        collapsed ? 'justify-center px-0' : 'px-3',
        active
          ? 'bg-white/[0.14] text-white'
          : 'text-white/65 hover:bg-white/[0.07] hover:text-white',
      )}
    >
      {active && (
        <span className="absolute inset-y-1 left-0 w-[3px] rounded-r-full bg-kpmg-lightblue" />
      )}
      <Icon
        className={cn(
          'size-[18px] shrink-0 transition-colors',
          active ? 'text-white' : 'text-white/60 group-hover:text-white',
        )}
        strokeWidth={1.9}
      />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </Link>
  )

  if (!collapsed) return link

  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right">{item.label}</TooltipContent>
    </Tooltip>
  )
}

export function Sidebar() {
  const pathname = usePathname()
  const collapsed = useUIStore((s) => s.sidebarCollapsed)
  const toggleSidebar = useUIStore((s) => s.toggleSidebar)

  const PinnedIcon = PINNED_NAV.icon
  const pinnedActive = isNavItemActive(PINNED_NAV.href, pathname)

  return (
    <aside
      className={cn(
        'flex h-full shrink-0 flex-col bg-rail-800 shadow-rail transition-[width] duration-200 ease-out',
        collapsed ? 'w-[72px]' : 'w-[217px]',
      )}
    >
      {/* Wordmark — doubles as the way back to the marketplace. */}
      <Link
        href="/"
        title="Back to K-Nexus.AI"
        className={cn(
          'flex h-[76px] shrink-0 items-center transition-colors hover:bg-white/[0.05]',
          collapsed ? 'justify-center px-0' : 'px-4',
        )}
      >
        <KpmgLogo collapsed={collapsed} />
      </Link>

      {/* Grouped navigation */}
      <nav className="rail-scroll flex-1 overflow-y-auto px-3 pb-2">
        {NAV_GROUPS.map((group) => (
          <div key={group.id} className="mb-1">
            {!collapsed ? (
              <p className="px-3 pb-1.5 pt-3 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-white/40">
                {group.label}
              </p>
            ) : (
              <div className="mx-auto my-3 h-px w-6 bg-white/10" />
            )}

            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavLink
                  key={item.href}
                  item={item}
                  active={isNavEntryActive(item, pathname)}
                  collapsed={collapsed}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Pinned AI Insights */}
      <div className={cn('shrink-0 pb-3', collapsed ? 'px-3' : 'px-3')}>
        <Link
          href={PINNED_NAV.href}
          className={cn(
            'flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-kpmg-purple to-kpmg-violet py-2.5 text-[13.5px] font-semibold text-white shadow-lg shadow-black/20 transition-opacity hover:opacity-95',
            collapsed ? 'justify-center px-0' : 'px-3',
            pinnedActive && 'ring-2 ring-white/30',
          )}
        >
          <PinnedIcon className="size-[18px] shrink-0" strokeWidth={2} />
          {!collapsed && <span>{PINNED_NAV.label}</span>}
        </Link>
      </div>

      {/* Collapse toggle */}
      <div
        className={cn(
          'flex h-[60px] shrink-0 items-center border-t border-white/[0.07]',
          collapsed ? 'justify-center px-0' : 'px-4',
        )}
      >
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="flex size-9 items-center justify-center rounded-full bg-white/[0.08] text-white/70 transition-colors hover:bg-white/[0.16] hover:text-white"
        >
          <ChevronsLeft
            className={cn(
              'size-[18px] transition-transform duration-200',
              collapsed && 'rotate-180',
            )}
          />
        </button>
      </div>
    </aside>
  )
}
