import type { Attribute } from '@/lib/attributes'
import { Card, cn } from '@/components/ui'

/** Hub readout: the four attributes as big numbers. */
export function AttributeTiles({ attributes }: { attributes: Attribute[] }) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {attributes.map((a) => (
        <Card key={a.key} padding="sm" className="text-center" title={`${a.label} ${a.source}`}>
          <div className="font-display hero-level text-2xl leading-none font-black">{a.value}</div>
          <div className="text-muted mt-1.5 text-[10px] font-bold tracking-[0.12em]">{a.short}</div>
        </Card>
      ))}
    </div>
  )
}

/** Profile readout: each attribute as a bar with the habit that grows it. */
export function AttributeBars({ attributes }: { attributes: Attribute[] }) {
  const scale = Math.max(20, ...attributes.map((a) => a.value))
  return (
    <ul className="grid gap-3">
      {attributes.map((a) => (
        <li key={a.key}>
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-semibold">
              {a.label} <span className="text-muted text-xs font-normal">{a.source}</span>
            </span>
            <span className="font-display text-lg font-black">{a.value}</span>
          </div>
          <div className="bg-surface-raised mt-1.5 h-2 overflow-hidden rounded-full">
            <div
              className={cn('from-accent-deep to-accent h-full rounded-full bg-linear-to-r')}
              style={{ width: `${Math.round((a.value / scale) * 100)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}
