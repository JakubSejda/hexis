import type { ReactNode, HTMLAttributes } from 'react'
import { cn } from '@/components/ui/utils/cn'

type Variant = 'region' | 'default'

const HEADER_CLASS: Record<Variant, string> = {
  region: 'text-muted font-mono text-xs tracking-[0.2em] uppercase',
  default: 'text-foreground text-base font-semibold',
}

type Props = {
  title?: string
  action?: ReactNode
  variant?: Variant
  children: ReactNode
} & HTMLAttributes<HTMLElement>

export function Section({
  title,
  action,
  variant = 'region',
  className,
  children,
  ...rest
}: Props) {
  return (
    <section className={cn('flex flex-col gap-3', className)} {...rest}>
      {title ? (
        <div className="flex items-end justify-between">
          <h2 className={HEADER_CLASS[variant]}>{title}</h2>
          {action ? <div>{action}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  )
}
