'use client'

type Props = {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  label?: string
  id?: string
}

export function Switch({ checked, onChange, disabled, label, id }: Props) {
  return (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={
        'hud-clip-sm focus-visible:ring-ring relative inline-flex h-6 w-10 items-center transition-colors focus-visible:ring-2 focus-visible:outline-none ' +
        (disabled ? 'cursor-not-allowed opacity-50 ' : 'cursor-pointer ') +
        (checked ? 'bg-system' : 'bg-border')
      }
    >
      <span
        className={
          // Square knob: the track already carries the HUD corner cut, and
          // clipping both turned the "on" state into an unreadable glyph.
          'inline-block h-4 w-4 transform transition-transform ' +
          (checked ? 'bg-background translate-x-5' : 'bg-muted-strong translate-x-1')
        }
      />
    </button>
  )
}
