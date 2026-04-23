'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

type Segment = {
  href: string
  label: string
}

type Props = {
  segments: Segment[]
  active: string
}

export function SegmentControl({ segments, active }: Props) {
  return (
    <div role="tablist" className="bg-surface flex gap-1 rounded-lg p-1">
      {segments.map((s) => {
        const isActive = s.href === active
        return (
          <Link
            key={s.href}
            href={s.href}
            role="tab"
            aria-selected={isActive}
            className={
              'flex-1 rounded-md px-3 py-2 text-center text-sm transition-colors ' +
              (isActive
                ? 'bg-primary text-background font-semibold'
                : 'text-muted hover:text-foreground')
            }
          >
            {s.label}
          </Link>
        )
      })}
    </div>
  )
}

/** Convenience wrapper for /progress segment control — auto-detects active path. */
export function ProgressSegmentControl() {
  const pathname = usePathname()
  const active = pathname?.startsWith('/progress/nutrition')
    ? '/progress/nutrition'
    : pathname?.startsWith('/progress/strength')
      ? '/progress/strength'
      : pathname?.startsWith('/progress/photos')
        ? '/progress/photos'
        : '/progress/body'
  return (
    <SegmentControl
      segments={[
        { href: '/progress/body', label: 'Tělo' },
        { href: '/progress/nutrition', label: 'Výživa' },
        { href: '/progress/strength', label: 'Síla' },
        { href: '/progress/photos', label: 'Fotky' },
      ]}
      active={active}
    />
  )
}
