import { Heading } from '@/components/ui'

type Props = { children: string; meta?: string; className?: string }

/** Section title: wide display caps on the left, an optional quiet readout on the right. */
export function RegionHeader({ children, meta, className }: Props) {
  return (
    <div className={'flex items-baseline justify-between gap-3 px-1 pb-2.5 ' + (className ?? '')}>
      <Heading level={2} variant="region" className="whitespace-nowrap">
        {children}
      </Heading>
      {meta ? <span className="text-muted text-xs font-semibold">{meta}</span> : null}
    </div>
  )
}
