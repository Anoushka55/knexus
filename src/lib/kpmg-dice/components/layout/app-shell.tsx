'use client'

import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'

import { DemoMenu } from './demo-menu'
import { Header } from './header'
import { ImportHydrator } from './import-hydrator'
import { LastUpdated } from './last-updated'
import { RestrictedScreen, useCanAccess } from './restriction'
import { Sidebar } from './sidebar'
import { TooltipProvider } from '@/lib/kpmg-dice/components/ui/tooltip'
import { resolveNavItem } from '@/lib/kpmg-dice/config/nav'

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <TooltipProvider delayDuration={80}>
      <ImportHydrator />
      <div className="flex h-screen w-full overflow-hidden bg-background">
        <Sidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <Header />

          <main className="scrollbar-slim flex-1 overflow-y-auto">
            <div className="mx-auto w-full max-w-[1600px] px-6 pb-8 pt-3">
              <div className="flex items-center justify-between gap-4">
                <DemoMenu />
                <LastUpdated />
              </div>
              <div className="mt-2">
                <Guarded>{children}</Guarded>
              </div>
            </div>
          </main>
        </div>
      </div>

    </TooltipProvider>
  )
}

/**
 * Renders the page, or the reason this seat cannot see it.
 *
 * Sits here rather than in each page so a route added later is covered by
 * default, and so typing a URL directly is stopped the same way clicking a
 * locked nav row is.
 */
function Guarded({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const allowed = useCanAccess(pathname)
  if (allowed) return <>{children}</>

  const { title } = resolveNavItem(pathname)
  return <RestrictedScreen href={pathname} label={title} />
}
