'use client'
import { AREA_META, MOBILE_TABS } from './area-meta'
import { useActiveArea } from './use-active-area'
import { NavLink } from '@/components/ui'

export function BottomNav() {
  const active = useActiveArea()
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
    </nav>
  )
}
