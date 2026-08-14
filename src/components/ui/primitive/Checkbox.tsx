'use client'
import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '../utils/cn'

/**
 * HUD hexagon checkbox (Reforge): the native input stays in the DOM for
 * full a11y/RTL semantics but is visually hidden; the visible control is
 * a hexagon (clip-path) that fills cyan when checked.
 */

const HEX_CLIP = {
  clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
} as const

type Props = {
  label?: string
  labelClassName?: string
  className?: string
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'className'>

export const Checkbox = forwardRef<HTMLInputElement, Props>(function Checkbox(
  { label, labelClassName, className, ...rest }: Props,
  ref
) {
  const control = (
    <span className="relative inline-flex size-5 shrink-0 items-center justify-center">
      <input
        ref={ref}
        type="checkbox"
        className={cn('peer absolute inset-0 z-10 size-5 cursor-pointer opacity-0', className)}
        {...rest}
      />
      {/* hex edge */}
      <span aria-hidden className="bg-border absolute inset-0" style={HEX_CLIP} />
      {/* hex body — cyan when checked */}
      <span
        aria-hidden
        className="bg-surface peer-checked:bg-system peer-focus-visible:bg-surface-raised absolute inset-[2px] transition-colors"
        style={HEX_CLIP}
      />
      {/* tick */}
      <svg
        aria-hidden
        viewBox="0 0 12 12"
        className="text-background invisible relative z-0 h-3 w-3 peer-checked:visible"
      >
        <path
          d="M2 6.5 5 9.5 10 3"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="square"
        />
      </svg>
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
