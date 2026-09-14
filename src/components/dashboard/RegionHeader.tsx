import { Heading } from '@/components/ui'

type Props = { children: string; className?: string }

/**
 * Section label with a rule line. The label itself is a real heading now — it
 * reads as one on screen, so it should read as one in the document outline too.
 */
export function RegionHeader({ children, className }: Props) {
  return (
    <div className={'flex items-center gap-2 px-1 pb-2 ' + (className ?? '')}>
      <Heading level={2} variant="region" className="font-medium whitespace-nowrap">
        {children}
      </Heading>
      <span aria-hidden className="bg-border h-px flex-1" />
    </div>
  )
}
