'use client'
import { useId, type ReactNode } from 'react'

type Props = {
  value: number | null
  onChange: (v: number | null) => void
  step?: number
  min?: number
  max?: number
  placeholder?: string
  suffix?: string
  label?: string
  hint?: string
  error?: string
  /** Explicit id for the inner <input>; auto-generated when omitted. */
  id?: string
  /** `hero` = the big workout stepper: round buttons, display-size number, label above. */
  variant?: 'default' | 'hero'
}

export function NumberInput({
  value,
  onChange,
  step = 1,
  min = 0,
  max = 999,
  placeholder,
  suffix,
  label,
  hint,
  error,
  id: idProp,
  variant = 'default',
}: Props) {
  const hero = variant === 'hero'
  const autoId = useId()
  const id = idProp ?? autoId
  const descriptionId = `${id}-desc`
  const handle = (delta: number) => {
    const current = value ?? 0
    const next = Math.max(min, Math.min(max, Math.round((current + delta) * 100) / 100))
    onChange(next)
  }

  const core: ReactNode = (
    <div
      className={
        hero ? 'flex items-center justify-between gap-1' : 'inline-flex items-center gap-1'
      }
    >
      <button
        type="button"
        aria-label="snížit"
        className={
          hero
            ? 'bg-surface-raised text-foreground active:bg-border size-10 shrink-0 rounded-full text-xl'
            : 'bg-surface-raised text-foreground active:bg-border h-11 w-11 rounded-full text-lg'
        }
        onClick={() => handle(-step)}
      >
        −
      </button>
      <input
        id={id}
        type="number"
        inputMode="decimal"
        placeholder={placeholder}
        value={value ?? ''}
        onChange={(e) => {
          const v = e.target.value
          onChange(v === '' ? null : Number(v))
        }}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error || hint ? descriptionId : undefined}
        className={
          hero
            ? 'font-display no-spin text-foreground w-full min-w-0 bg-transparent text-center text-[2.6rem] leading-none font-black focus-visible:outline-none'
            : 'bg-surface-raised text-foreground rounded-control font-display no-spin h-11 w-16 border text-center font-black ' +
              (error ? 'border-danger' : 'border-transparent')
        }
        step={step}
        min={min}
        max={max}
      />
      {suffix && !hero ? <span className="text-muted text-xs">{suffix}</span> : null}
      <button
        type="button"
        aria-label="zvýšit"
        className={
          hero
            ? 'bg-surface-raised text-foreground active:bg-border size-10 shrink-0 rounded-full text-xl'
            : 'bg-surface-raised text-foreground active:bg-border h-11 w-11 rounded-full text-lg'
        }
        onClick={() => handle(step)}
      >
        +
      </button>
    </div>
  )

  if (!label && !hint && !error) {
    return core
  }

  return (
    <label htmlFor={id} className="flex flex-col gap-1">
      {label ? (
        <span
          className={
            hero
              ? 'text-muted text-center text-[11px] font-bold tracking-[0.12em] uppercase'
              : 'text-muted text-xs font-medium'
          }
        >
          {label}
        </span>
      ) : null}
      {core}
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
}
