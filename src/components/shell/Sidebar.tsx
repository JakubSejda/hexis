'use client'
import { AREA_META, SIDEBAR_AREAS } from './area-meta'
import { useActiveArea } from './use-active-area'
import { cn, NavLink } from '@/components/ui'

export function Sidebar() {
  const active = useActiveArea()
  return (
    <aside
      aria-label="Primary"
      className="bg-surface-sunken border-border fixed top-0 left-0 z-40 hidden h-screen w-[220px] flex-col border-r py-4 md:flex"
    >
      <div className="border-border text-accent mb-3 border-b px-4 pb-4 font-mono text-base font-bold tracking-[0.2em] uppercase">
        Hexis
      </div>

      <SectionLabel>Life Areas</SectionLabel>
      {SIDEBAR_AREAS.map((area) => {
        const meta = AREA_META[area]
        return (
          <NavLink
            key={area}
            href={meta.href}
            active={active === area}
            variant="side"
            icon={meta.icon}
          >
            {meta.label}
          </NavLink>
        )
      })}

      <div className="flex-1" />

      <div className="border-border border-t pt-2">
        <NavLink
          href={AREA_META.settings.href}
          active={active === 'settings'}
          variant="side"
          icon={AREA_META.settings.icon}
        >
          {AREA_META.settings.label}
        </NavLink>
      </div>
    </aside>
  )
}

function SectionLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'text-muted px-4 pt-2 pb-1 font-mono text-xs tracking-[0.2em] uppercase',
        className
      )}
    >
      {children}
    </div>
  )
}
