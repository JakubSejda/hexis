import { forwardRef, useId, type TextareaHTMLAttributes } from 'react'
import { cn } from '../utils/cn'

const BASE =
  'block w-full rounded-md border bg-background p-3 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50'

type Props = {
  error?: string
  label?: string
  hint?: string
  className?: string
  id?: string
} & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'className'>

export const Textarea = forwardRef<HTMLTextAreaElement, Props>(function Textarea(
  { error, label, hint, className, id, ...rest }: Props,
  ref
) {
  const autoId = useId()
  const areaId = id ?? autoId
  const descriptionId = `${areaId}-desc`

  const areaEl = (
    <textarea
      ref={ref}
      id={areaId}
      aria-invalid={error ? 'true' : undefined}
      aria-describedby={error || hint ? descriptionId : undefined}
      className={cn(BASE, error ? 'border-danger' : 'border-border', className)}
      {...rest}
    />
  )

  if (!label && !hint && !error) {
    return areaEl
  }

  return (
    <label htmlFor={areaId} className="flex flex-col gap-1">
      {label ? <span className="text-muted text-xs font-medium">{label}</span> : null}
      {areaEl}
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
