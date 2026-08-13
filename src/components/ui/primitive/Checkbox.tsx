import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '../utils/cn'

type Props = {
  label?: string
  labelClassName?: string
  className?: string
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'className'>

export const Checkbox = forwardRef<HTMLInputElement, Props>(function Checkbox(
  { label, labelClassName, className, ...rest }: Props,
  ref
) {
  const input = (
    <input
      ref={ref}
      type="checkbox"
      className={cn('accent-accent size-5 cursor-pointer', className)}
      {...rest}
    />
  )

  if (!label) return input

  return (
    <label className={cn('flex cursor-pointer items-center gap-2 text-sm', labelClassName)}>
      {input}
      <span>{label}</span>
    </label>
  )
})
