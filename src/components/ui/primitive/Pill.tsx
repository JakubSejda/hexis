import { forwardRef, type ReactNode, type HTMLAttributes, type MouseEvent } from 'react'
import { X } from 'lucide-react'
import { cn } from '../utils/cn'

type Variant = 'neutral' | 'success' | 'warning' | 'danger' | 'accent'
type Size = 'sm' | 'md'

const VARIANT_CLASS: Record<Variant, string> = {
  neutral: 'bg-surface-raised text-foreground',
  success: 'bg-primary-soft text-primary',
  warning: 'bg-accent-soft text-accent',
  danger: 'bg-danger text-background',
  accent: 'bg-accent text-background',
}

const SIZE_CLASS: Record<Size, string> = {
  sm: 'h-5 px-2 text-xs',
  md: 'h-6 px-3 text-sm',
}

const BASE = 'inline-flex items-center gap-1 rounded-md font-medium'

type PillProps = {
  variant?: Variant
  size?: Size
  className?: string
  children: ReactNode
} & Omit<HTMLAttributes<HTMLSpanElement>, 'className'>

export const Pill = forwardRef<HTMLSpanElement, PillProps>(function Pill(
  { variant = 'neutral', size = 'sm', className, children, ...rest }: PillProps,
  ref
) {
  return (
    <span
      ref={ref}
      className={cn(BASE, VARIANT_CLASS[variant], SIZE_CLASS[size], className)}
      {...rest}
    >
      {children}
    </span>
  )
})

type TagProps = {
  variant?: Variant
  size?: Size
  onRemove?: () => void
  onClick?: () => void
  className?: string
  children: ReactNode
} & Omit<HTMLAttributes<HTMLElement>, 'className' | 'onClick'>

export const Tag = forwardRef<HTMLSpanElement | HTMLButtonElement, TagProps>(function Tag(
  { variant = 'neutral', size = 'sm', onRemove, onClick, className, children, ...rest }: TagProps,
  ref
) {
  const classes = cn(BASE, VARIANT_CLASS[variant], SIZE_CLASS[size], className)

  // No handlers: plain span
  if (!onClick && !onRemove) {
    return (
      <span ref={ref as React.Ref<HTMLSpanElement>} className={classes} {...rest}>
        {children}
      </span>
    )
  }

  // onClick only (no remove): simple button
  if (onClick && !onRemove) {
    return (
      <button
        ref={ref as React.Ref<HTMLButtonElement>}
        type="button"
        className={classes}
        onClick={onClick}
        {...rest}
      >
        {children}
      </button>
    )
  }

  // onRemove present (onClick optional): sibling-button group
  const handleRemove = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    onRemove?.()
  }

  const body = onClick ? (
    <button type="button" className={cn(classes, 'pr-1')} onClick={onClick}>
      {children}
    </button>
  ) : (
    <span className={cn(classes, 'pr-1')}>{children}</span>
  )

  return (
    <span
      ref={ref as React.Ref<HTMLSpanElement>}
      role="group"
      className="inline-flex items-center gap-0.5"
      {...rest}
    >
      {body}
      <button
        type="button"
        data-testid="tag-remove"
        onClick={handleRemove}
        aria-label="Remove"
        className={cn(
          'inline-flex items-center justify-center rounded px-1',
          VARIANT_CLASS[variant]
        )}
      >
        <X size={12} />
      </button>
    </span>
  )
})
