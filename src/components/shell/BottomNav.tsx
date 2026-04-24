'use client'
import Link from 'next/link'
import { AREA_META, MOBILE_TABS } from './area-meta'
import { useActiveArea } from './use-active-area'
import { cn } from '@/components/ui'

export function BottomNav() {
  const active = useActiveArea()
  return (
    <nav
      aria-label="Primary"
      className="border-border bg-surface fixed right-0 bottom-0 left-0 z-40 flex h-16 border-t pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      {MOBILE_TABS.map((area) => {
        const meta = AREA_META[area]
        const Icon = meta.icon
        const isActive = active === area
        return (
          <Link
            key={area}
            href={meta.href}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'flex flex-1 flex-col items-center justify-center gap-1 text-[10px] transition-colors',
              isActive ? 'text-accent' : 'text-muted hover:text-foreground'
            )}
          >
            <Icon className="h-5 w-5" aria-hidden />
            <span>{meta.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
