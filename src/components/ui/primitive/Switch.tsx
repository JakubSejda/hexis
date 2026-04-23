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
        'relative inline-flex h-6 w-10 items-center rounded-full transition-colors ' +
        (disabled ? 'cursor-not-allowed opacity-50 ' : 'cursor-pointer ') +
        (checked ? 'bg-primary' : 'bg-border')
      }
    >
      <span
        className={
          'inline-block h-4 w-4 transform rounded-full bg-white transition-transform ' +
          (checked ? 'translate-x-5' : 'translate-x-1')
        }
      />
    </button>
  )
}
