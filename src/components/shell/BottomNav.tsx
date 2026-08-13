'use client'
import { useState } from 'react'
import { Menu } from 'lucide-react'
import { AREA_META, MOBILE_TABS, MORE_AREAS } from './area-meta'
import { MoreSheet } from './MoreSheet'
import { useActiveArea } from './use-active-area'
import { cn, NavLink } from '@/components/ui'

export function BottomNav() {
  const active = useActiveArea()
  const [moreOpen, setMoreOpen] = useState(false)
  const moreActive = active != null && MORE_AREAS.includes(active)

  return (
    <nav
      aria-label="Primary"
      className="border-border bg-surface fixed right-0 bottom-0 left-0 z-40 flex h-16 border-t pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      {MOBILE_TABS.map((area) => {
        const meta = AREA_META[area]
        return (
          <NavLink
            key={area}
            href={meta.href}
            active={active === area}
            variant="bottom"
            icon={meta.icon}
          >
            {meta.label}
          </NavLink>
        )
      })}
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={moreOpen}
        onClick={() => setMoreOpen(true)}
        className={cn(
          'flex flex-1 flex-col items-center justify-center gap-1 text-xs transition-colors',
          moreActive ? 'text-accent' : 'text-muted hover:text-foreground'
        )}
      >
        <Menu className="h-6 w-6" aria-hidden />
        <span>Více</span>
      </button>
      <MoreSheet open={moreOpen} onOpenChange={setMoreOpen} activeArea={active} />
    </nav>
  )
}
