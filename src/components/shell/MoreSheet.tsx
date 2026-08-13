'use client'
import Link from 'next/link'
import { BottomSheet, cn } from '@/components/ui'
import { AREA_META, MORE_AREAS, type Area } from './area-meta'

type Props = {
  open: boolean
  onOpenChange: (v: boolean) => void
  activeArea: Area | null
}

export function MoreSheet({ open, onOpenChange, activeArea }: Props) {
  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title="Více">
      <nav aria-label="Více" className="grid grid-cols-2 gap-1">
        {MORE_AREAS.map((area) => {
          const meta = AREA_META[area]
          const Icon = meta.icon
          const isActive = activeArea === area
          return (
            <Link
              key={area}
              href={meta.href}
              aria-current={isActive ? 'page' : undefined}
              onClick={() => onOpenChange(false)}
              className={cn(
                'flex min-h-11 items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors',
                isActive
                  ? 'text-accent bg-surface-raised'
                  : 'text-foreground hover:bg-surface-raised'
              )}
            >
              <Icon className="h-5 w-5" aria-hidden />
              <span>{meta.label}</span>
            </Link>
          )
        })}
      </nav>
    </BottomSheet>
  )
}
