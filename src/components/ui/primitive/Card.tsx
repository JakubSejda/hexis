import { forwardRef, type ElementType, type ReactNode, type AllHTMLAttributes } from 'react'
import { cn } from '../utils/cn'

/**
 * HUD plate (Reforge). Two layers: the outer element is the 1px edge-light
 * (p-px + edge color), the inner layer is the surface — both share the same
 * corner-cut clip, which is what makes the edge follow the angular shape.
 * Binding reference: docs/superpowers/prototypes/2026-08-14-reforge/variant-b.html
 */

type Variant = 'default' | 'interactive' | 'flush'
type Padding = 'none' | 'sm' | 'md' | 'lg'
type Edge = 'default' | 'system' | 'accent'

/** Edge-light color (outer layer background). Grammar: cyan = active/system, amber = the screen's CTA plate. */
const EDGE_CLASS: Record<Edge, string> = {
  default: 'bg-border',
  system: 'bg-system',
  accent: 'bg-accent',
}

const OUTER_VARIANT_CLASS: Record<Variant, string> = {
  default: '',
  interactive:
    'group cursor-pointer transition-colors hover:bg-system focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
  flush: '',
}

const INNER_VARIANT_CLASS: Record<Variant, string> = {
  default: 'bg-surface',
  interactive: 'bg-surface transition-colors group-hover:bg-surface-raised',
  flush: 'bg-surface',
}

const PADDING_CLASS: Record<Padding, string> = {
  none: '',
  sm: 'p-2',
  md: 'p-4',
  lg: 'p-6',
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
      className={cn('hud-clip p-px', EDGE_CLASS[edge], OUTER_VARIANT_CLASS[variant], className)}
      {...rest}
    >
      <div
        className={cn(
          'hud-clip h-full w-full',
          INNER_VARIANT_CLASS[variant],
          PADDING_CLASS[effectivePadding]
        )}
      >
        {children}
      </div>
    </AnyAs>
  )
})
