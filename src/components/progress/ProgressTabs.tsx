import Link from 'next/link'
import { cn } from '@/components/ui'

const TABS = [
  { href: '/progress', label: 'Míry' },
  { href: '/progress/photos', label: 'Fotky' },
  { href: '/stats/strength', label: 'Síla' },
] as const

/** Míry · Fotky · Síla — the three ways Progres measures the change. */
export function ProgressTabs({ active }: { active: (typeof TABS)[number]['href'] }) {
  return (
    <nav
      aria-label="Progres"
      className="border-border bg-surface flex gap-1 rounded-full border p-1"
    >
      {TABS.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          aria-current={t.href === active ? 'page' : undefined}
          className={cn(
            'flex h-10 flex-1 items-center justify-center rounded-full text-sm font-semibold transition-colors',
            t.href === active
              ? 'bg-accent text-accent-foreground'
              : 'text-muted hover:text-foreground'
          )}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  )
}
