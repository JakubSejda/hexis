import { forwardRef, type ElementType, type ReactNode, type AllHTMLAttributes } from 'react'
import { cn } from '@/components/ui/utils/cn'

type Variant = 'default' | 'interactive' | 'flush'
type Padding = 'none' | 'sm' | 'md' | 'lg'

const VARIANT_CLASS: Record<Variant, string> = {
  default: 'bg-surface',
  interactive:
    'bg-surface cursor-pointer hover:bg-surface-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
  flush: 'bg-surface',
}

const PADDING_CLASS: Record<Padding, string> = {
  none: '',
  sm: 'p-2',
  md: 'p-4',
  lg: 'p-6',
}

const BASE = 'border border-border rounded-2xl'

type Props = {
  as?: ElementType
  variant?: Variant
  padding?: Padding
  children: ReactNode
  className?: string
} & Omit<AllHTMLAttributes<HTMLElement>, 'className'>

export const Card = forwardRef<HTMLElement, Props>(function Card(
  { as: As = 'div', variant = 'default', padding, children, className, ...rest }: Props,
  ref
) {
  const effectivePadding: Padding = padding ?? (variant === 'flush' ? 'none' : 'md')
  const classes = cn(BASE, VARIANT_CLASS[variant], PADDING_CLASS[effectivePadding], className)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const AnyAs = As as any
  return (
    <AnyAs ref={ref} className={classes} {...rest}>
      {children}
    </AnyAs>
  )
})
