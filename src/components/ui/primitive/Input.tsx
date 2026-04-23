import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react'
import { Search } from 'lucide-react'
import { cn } from '../utils/cn'

type Variant = 'default' | 'search'
type Size = 'sm' | 'md' | 'lg'

const SIZE_CLASS: Record<Size, string> = {
  sm: 'h-8 text-sm',
  md: 'h-10 text-sm',
  lg: 'h-12 text-base',
}

const BASE =
  'block w-full rounded-md border bg-background text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50'

type Props = {
  variant?: Variant
  size?: Size
  error?: string
  label?: string
  hint?: string
  iconLeft?: ReactNode
  iconRight?: ReactNode
  className?: string
  id?: string
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'className'>

export const Input = forwardRef<HTMLInputElement, Props>(function Input(
  {
    variant = 'default',
    size = 'md',
    error,
    label,
    hint,
    iconLeft,
    iconRight,
    className,
    id,
    ...rest
  }: Props,
  ref
) {
  const autoId = useId()
  const inputId = id ?? autoId
  const descriptionId = `${inputId}-desc`

  const effectiveIconLeft =
    variant === 'search' ? (
      <Search data-testid="input-search-icon" size={16} className="text-muted" />
    ) : (
      iconLeft
    )

  const hasIconLeft = Boolean(effectiveIconLeft)
  const hasIconRight = Boolean(iconRight)

  const inputEl = (
    <div className="relative">
      {hasIconLeft ? (
        <span className="text-muted pointer-events-none absolute top-1/2 left-3 -translate-y-1/2">
          {effectiveIconLeft}
        </span>
      ) : null}
      <input
        ref={ref}
        id={inputId}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error || hint ? descriptionId : undefined}
        className={cn(
          BASE,
          SIZE_CLASS[size],
          hasIconLeft ? 'pl-9' : 'px-3',
          hasIconRight ? 'pr-9' : '',
          error ? 'border-danger' : 'border-border',
          className
        )}
        {...rest}
      />
      {hasIconRight ? (
        <span className="text-muted pointer-events-none absolute top-1/2 right-3 -translate-y-1/2">
          {iconRight}
        </span>
      ) : null}
    </div>
  )

  if (!label && !hint && !error) {
    return inputEl
  }

  return (
    <label htmlFor={inputId} className="flex flex-col gap-1">
      {label ? <span className="text-muted text-xs font-medium">{label}</span> : null}
      {inputEl}
      {error ? (
        <span id={descriptionId} className="text-danger text-xs">
          {error}
        </span>
      ) : hint ? (
        <span id={descriptionId} className="text-muted text-xs">
          {hint}
        </span>
      ) : null}
    </label>
  )
})
