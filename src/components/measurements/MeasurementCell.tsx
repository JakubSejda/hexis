'use client'

import { useState, useRef, useEffect } from 'react'
import { Input } from '@/components/ui'

type Props = {
  value: number | null
  precision: number
  align?: 'left' | 'right'
  onCommit: (value: number | null) => Promise<void>
}

export function MeasurementCell({ value, precision, align = 'right', onCommit }: Props) {
  const [editing, setEditing] = useState(false)
  const formatted = value == null ? '' : value.toFixed(precision)
  const [draft, setDraft] = useState<string>(formatted)
  // Render-phase sync: reset draft when the parent-supplied value/precision
  // change. Preferred over useEffect+setState, which the react-hooks rules flag.
  const [lastFormatted, setLastFormatted] = useState(formatted)
  if (formatted !== lastFormatted) {
    setLastFormatted(formatted)
    setDraft(formatted)
  }
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  async function commit() {
    setEditing(false)
    const trimmed = draft.trim()
    const next = trimmed === '' ? null : Number(trimmed)
    if (next != null && Number.isNaN(next)) return
    if (next === value) return
    await onCommit(next)
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className={
          'hover:bg-border block w-full rounded px-1 py-1 text-sm ' +
          (align === 'right' ? 'text-right ' : 'text-left ') +
          (value == null ? 'text-muted' : 'text-foreground')
        }
      >
        {value == null ? '—' : value.toFixed(precision)}
      </button>
    )
  }

  return (
    <Input
      ref={inputRef}
      type="number"
      inputMode="decimal"
      step={1 / Math.pow(10, precision)}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => void commit()}
      onKeyDown={(e) => {
        if (e.key === 'Enter') void commit()
        if (e.key === 'Escape') {
          setDraft(value == null ? '' : value.toFixed(precision))
          setEditing(false)
        }
      }}
      className={'px-1 py-1 ' + (align === 'right' ? 'text-right' : 'text-left')}
    />
  )
}
