import Link from 'next/link'
import { cn } from '@/components/ui'

export type SideQuest = {
  key: string
  label: string
  detail: string
  xp: number
  done: boolean
  href: string
}

/** Small daily chores that pay XP: each row links to where it gets done. */
export function SideQuests({ items }: { items: SideQuest[] }) {
  return (
    <ul className="grid gap-2">
      {items.map((q) => (
        <li key={q.key}>
          <Link
            href={q.href}
            data-done={q.done || undefined}
            className="rounded-card border-border bg-surface hover:bg-surface-raised flex items-center gap-3 border px-4 py-3.5 transition-colors active:scale-[0.99]"
          >
            <span
              aria-hidden
              className={cn(
                'rounded-tick grid size-7 shrink-0 place-items-center border-2 text-sm font-bold',
                q.done ? 'border-success bg-success text-background' : 'border-border'
              )}
            >
              {q.done ? '✓' : null}
            </span>
            <span className="flex-1">
              <span className={cn('block font-semibold', q.done && 'text-muted')}>{q.label}</span>
              <span className="text-muted block text-xs">{q.detail}</span>
            </span>
            <span
              className={cn(
                'rounded-tick font-display px-2 py-1 text-xs font-black',
                q.done ? 'bg-success text-background' : 'bg-surface-raised text-accent'
              )}
            >
              +{q.xp}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  )
}
