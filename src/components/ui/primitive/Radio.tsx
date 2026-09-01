'use client'
import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '../utils/cn'

/**
 * HUD hexagon radio (Reforge): native input for semantics, hexagonal
 * visual with a cyan hex core when selected.
 */

type Props = {
  label?: string
  labelClassName?: string
  className?: string
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'className'>

export const Radio = forwardRef<HTMLInputElement, Props>(function Radio(
  { label, labelClassName, className, ...rest }: Props,
  ref
) {
  const control = (
    <span className="relative inline-flex size-4 shrink-0 items-center justify-center">
      <input
        ref={ref}
        type="radio"
        className={cn('peer absolute inset-0 z-10 size-4 cursor-pointer opacity-0', className)}
        {...rest}
      />
      <span aria-hidden className="hud-hex bg-border absolute inset-0" />
      <span
        aria-hidden
        className="hud-hex bg-surface peer-focus-visible:bg-surface-raised absolute inset-[2px] transition-colors"
      />
      <span
        aria-hidden
        className="hud-hex bg-system invisible absolute inset-[5px] peer-checked:visible"
      />
    </span>
  )

  if (!label) return control

  return (
    <label className={cn('flex cursor-pointer items-center gap-2 text-sm', labelClassName)}>
      {control}
      <span>{label}</span>
    </label>
  )
})
