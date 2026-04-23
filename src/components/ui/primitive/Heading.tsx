import { forwardRef, type ReactNode, type HTMLAttributes } from 'react'
import { cn } from '@/components/ui/utils/cn'

type Level = 1 | 2 | 3
type As = 'h1' | 'h2' | 'h3' | 'div'
type Variant = 'display' | 'default' | 'region'

const DEFAULT_LEVEL_CLASS: Record<Level, string> = {
  1: 'text-2xl font-semibold',
  2: 'text-lg font-semibold',
  3: 'text-base font-semibold',
}

const DISPLAY_CLASS = 'text-3xl font-semibold tracking-tight'
const REGION_CLASS = 'font-mono text-xs uppercase tracking-[0.2em] text-muted'

export type HeadingProps = {
  level: Level
  as?: As
  variant?: Variant
  children: ReactNode
  className?: string
} & Omit<HTMLAttributes<HTMLElement>, 'className'>

const LEVEL_TO_TAG: Record<Level, As> = { 1: 'h1', 2: 'h2', 3: 'h3' }

export const Heading = forwardRef<HTMLElement, HeadingProps>(function Heading(
  { level, as, variant = 'default', className, children, ...rest }: HeadingProps,
  ref
) {
  const Tag = (as ?? LEVEL_TO_TAG[level]) as As
  const variantClass =
    variant === 'display'
      ? DISPLAY_CLASS
      : variant === 'region'
        ? REGION_CLASS
        : DEFAULT_LEVEL_CLASS[level]
  const classes = cn(variantClass, className)
  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <Tag ref={ref as any} className={classes} {...rest}>
      {children}
    </Tag>
  )
})
