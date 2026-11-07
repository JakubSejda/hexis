'use client'
import { AREA_META, MOBILE_TABS, PROFILE_AREAS } from './area-meta'
import { useActiveArea } from './use-active-area'
import { NavLink } from '@/components/ui'

/** Floating pill dock: the four daily areas plus the player profile. */
export function BottomNav() {
  const active = useActiveArea()
  const onProfile = active === 'bio' || (active != null && PROFILE_AREAS.includes(active))

  return (
    <nav
      aria-label="Hlavní navigace"
      className="fixed inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-40 md:hidden"
    >
      <div className="rounded-card border-border bg-surface/90 flex h-16 gap-1 border p-1.5 shadow-lg backdrop-blur-md">
        {MOBILE_TABS.map((area) => {
          const meta = AREA_META[area]
          const isActive = area === 'bio' ? onProfile : active === area
          return (
            <NavLink
              key={area}
              href={meta.href}
              active={isActive}
              variant="bottom"
              icon={meta.icon}
            >
              {meta.short ?? meta.label}
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
