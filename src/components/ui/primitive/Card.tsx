import { forwardRef, type ElementType, type ReactNode, type AllHTMLAttributes } from 'react'
import { cn } from '../utils/cn'

/**
 * D plate: one rounded surface with a hairline edge. `edge` tints that hairline
 * (system = active, accent = the screen's CTA plate).
 * Binding reference: docs/design/2026-11-redesign-d/D-kombinace.html
 */

type Variant = 'default' | 'interactive' | 'flush'
type Padding = 'none' | 'sm' | 'md' | 'lg'
type Edge = 'default' | 'system' | 'accent'

const EDGE_CLASS: Record<Edge, string> = {
  default: 'border-border',
  system: 'border-system/60',
  accent: 'border-accent/70 shadow-glow',
}

const VARIANT_CLASS: Record<Variant, string> = {
  default: 'bg-surface',
  interactive:
    'bg-surface cursor-pointer transition-colors hover:bg-surface-raised active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
  flush: 'bg-surface',
}

const PADDING_CLASS: Record<Padding, string> = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-5',
}

type Props = {
  as?: ElementType
  variant?: Variant
  padding?: Padding
  edge?: Edge
  children: ReactNode
  className?: string
} & Omit<AllHTMLAttributes<HTMLElement>, 'className' | 'as'>

export const Card = forwardRef<HTMLElement, Props>(function Card(
  {
    as: As = 'div',
    variant = 'default',
    padding,
    edge = 'default',
    children,
    className,
    ...rest
  }: Props,
  ref
) {
  const effectivePadding: Padding = padding ?? (variant === 'flush' ? 'none' : 'md')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const AnyAs = As as any
  return (
    <AnyAs
      ref={ref}
      className={cn(
        'rounded-card border transition-transform',
        EDGE_CLASS[edge],
        VARIANT_CLASS[variant],
        PADDING_CLASS[effectivePadding],
        className
      )}
      {...rest}
    >
      {children}
    </AnyAs>
  )
})
