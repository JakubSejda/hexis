'use client'
import { useId } from 'react'
import { cn } from '../utils/cn'

type Option = { label: string; value: string }

type Props = {
  /** Radio group name — must be unique per rendered group on a page. */
  name: string
  /** Accessible name for the whole group; rendered as a visually hidden legend. */
  label: string
  options: readonly Option[]
  value: string
  onChange: (value: string) => void
  className?: string
}

/**
 * Pick-one control in HUD dress, built on native radios.
 *
 * The two call sites used to be hand-rolled `role="tablist"` / `role="tab"`
 * markup with no `aria-controls`, no panels and no arrow-key handling — a tab
 * bar that promised panels it did not have (WIG audit, findings 23 and 24).
 * Native radios inside a fieldset give arrow-key navigation, roving focus and
 * screen-reader semantics with no ARIA at all.
 */
export function SegmentedControl({ name, label, options, value, onChange, className }: Props) {
  const id = useId()
  return (
    <fieldset className={cn('hud-clip-sm bg-surface flex gap-1 p-1', className)}>
      <legend className="sr-only">{label}</legend>
      {options.map((o) => {
        const inputId = `${id}-${o.value}`
        const active = o.value === value
        return (
          <label
            key={o.value}
            htmlFor={inputId}
            className={cn(
              'hud-clip-sm flex min-h-11 flex-1 cursor-pointer items-center justify-center px-3 text-center font-mono text-sm transition-colors',
              'has-[:focus-visible]:ring-ring has-[:focus-visible]:ring-2',
              active
                ? 'bg-system text-background font-semibold'
                : 'text-muted hover:text-foreground'
            )}
          >
            <input
              id={inputId}
              type="radio"
              name={name}
              value={o.value}
              checked={active}
              onChange={() => onChange(o.value)}
              className="sr-only"
            />
            {o.label}
          </label>
        )
      })}
    </fieldset>
  )
}
