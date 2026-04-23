import { forwardRef, useId, type ReactNode, type SelectHTMLAttributes } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '../utils/cn'

type Size = 'sm' | 'md' | 'lg'

const SIZE_CLASS: Record<Size, string> = {
  sm: 'h-8 text-sm',
  md: 'h-10 text-sm',
  lg: 'h-12 text-base',
}

const BASE =
  'block w-full appearance-none rounded-md border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 pl-3 pr-9'

type Props = {
  size?: Size
  error?: string
  label?: string
  hint?: string
  className?: string
  id?: string
  children: ReactNode
} & Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size' | 'className' | 'children'>

export const Select = forwardRef<HTMLSelectElement, Props>(function Select(
  { size = 'md', error, label, hint, className, id, children, ...rest }: Props,
  ref
) {
  const autoId = useId()
  const selectId = id ?? autoId
  const descriptionId = `${selectId}-desc`

  const selectEl = (
    <div className="relative">
      <select
        ref={ref}
        id={selectId}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error || hint ? descriptionId : undefined}
        className={cn(BASE, SIZE_CLASS[size], error ? 'border-danger' : 'border-border', className)}
        {...rest}
      >
        {children}
      </select>
      <ChevronDown
        data-testid="select-chevron"
        size={16}
        className="text-muted pointer-events-none absolute top-1/2 right-3 -translate-y-1/2"
      />
    </div>
  )

  if (!label && !hint && !error) {
    return selectEl
  }

  return (
    <label htmlFor={selectId} className="flex flex-col gap-1">
      {label ? <span className="text-muted text-xs font-medium">{label}</span> : null}
      {selectEl}
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
