'use client'
import Link from 'next/link'
import { AREA_META, SIDEBAR_AREAS, PLACEHOLDER_META, PLACEHOLDER_ORDER } from './area-meta'
import { useActiveArea } from './use-active-area'
import { cn } from '@/components/ui'

export function Sidebar() {
  const active = useActiveArea()
  return (
    <aside
      aria-label="Primary"
      className="bg-surface-sunken border-border fixed top-0 left-0 z-40 hidden h-screen w-[220px] flex-col border-r py-4 md:flex"
    >
      <div className="border-border text-accent mb-3 border-b px-4 pb-4 text-base font-bold tracking-[0.2em] uppercase">
        Hexis
      </div>

      <SectionLabel>Life Areas</SectionLabel>
      {SIDEBAR_AREAS.map((area) => {
        const meta = AREA_META[area]
        const Icon = meta.icon
        const isActive = active === area
        return (
          <Link
            key={area}
            href={meta.href}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'flex items-center gap-2.5 px-4 py-2 text-sm transition-colors',
              isActive
                ? 'text-accent border-accent bg-surface border-l-2 pl-[14px]'
                : 'text-muted hover:bg-surface hover:text-foreground'
            )}
          >
            <Icon className="h-4 w-4" aria-hidden />
            <span>{meta.label}</span>
          </Link>
        )
      })}

      <SectionLabel className="mt-4">Coming soon</SectionLabel>
      {PLACEHOLDER_ORDER.map((key) => {
        const meta = PLACEHOLDER_META[key]
        const Icon = meta.icon
        return (
          <div
            key={key}
            aria-disabled="true"
            title="Coming in SP5"
            className="text-muted flex items-center gap-2.5 px-4 py-2 text-sm italic opacity-50"
          >
            <Icon className="h-4 w-4" aria-hidden />
            <span>{meta.label}</span>
            <span className="bg-surface text-muted ml-auto rounded px-1.5 py-0.5 text-[9px] tracking-[0.15em]">
              SP5
            </span>
          </div>
        )
      })}

      <div className="flex-1" />

      <div className="border-border border-t pt-2">
        <Link
          href={AREA_META.settings.href}
          aria-current={active === 'settings' ? 'page' : undefined}
          className={cn(
            'flex items-center gap-2.5 px-4 py-2 text-sm transition-colors',
            active === 'settings'
              ? 'text-accent border-accent bg-surface border-l-2 pl-[14px]'
              : 'text-muted hover:bg-surface hover:text-foreground'
          )}
        >
          <AREA_META.settings.icon className="h-4 w-4" aria-hidden />
          <span>{AREA_META.settings.label}</span>
        </Link>
      </div>
    </aside>
  )
}

function SectionLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn('text-muted px-4 pt-2 pb-1 text-[10px] tracking-[0.15em] uppercase', className)}
    >
      {children}
    </div>
  )
}
