'use client'

import { useState } from 'react'
import { BottomSheet, NumberInput, ProgressBar } from '@/components/ui'
import { classifyDay, classifyMacro } from '@/lib/nutrition-classify'
import { useXpFeedback } from '@/components/xp/XpFeedbackProvider'

type DayRow = {
  date: string
  kcalActual: number | null
  proteinG: number | null
  carbsG: number | null
  fatG: number | null
  sugarG: number | null
  note: string | null
}

type WeekTargets = {
  targetKcal: number | null
  targetProteinG: number | null
  targetCarbsG: number | null
  targetFatG: number | null
  targetSugarG: number | null
}

type Props = {
  open: boolean
  date: string | null
  initial: DayRow | null
  trackedMacros: string[]
  targets: WeekTargets | null
  onClose: () => void
  onSaved: (row: DayRow) => void
}

export function DailyModal({
  open,
  date,
  initial,
  trackedMacros,
  targets,
  onClose,
  onSaved,
}: Props) {
  const { notifyXp } = useXpFeedback()
  const derivedDraft: DayRow | null =
    initial ??
    (date
      ? {
          date,
          kcalActual: null,
          proteinG: null,
          carbsG: null,
          fatG: null,
          sugarG: null,
          note: null,
        }
      : null)
  const [draft, setDraft] = useState<DayRow | null>(derivedDraft)
  // Render-phase sync: reset local draft whenever the parent switches day.
  const [lastKey, setLastKey] = useState<string | null>(date)
  if (lastKey !== date) {
    setLastKey(date)
    setDraft(derivedDraft)
  }

  if (!open || !date || !draft) return null

  async function save() {
    if (!draft) return
    const res = await fetch('/api/nutrition', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        date: draft.date,
        kcalActual: draft.kcalActual,
        proteinG: draft.proteinG,
        carbsG: trackedMacros.includes('carbs') ? draft.carbsG : undefined,
        fatG: trackedMacros.includes('fat') ? draft.fatG : undefined,
        sugarG: trackedMacros.includes('sugar') ? draft.sugarG : undefined,
        note: draft.note,
      }),
    })
    if (res.ok) {
      const result = await res.json()
      notifyXp(result)
      onSaved(draft)
      onClose()
    }
  }

  const kcalClass = classifyDay({
    kcalActual: draft.kcalActual,
    targetKcal: targets?.targetKcal ?? null,
  })
  const proteinClass = classifyMacro({
    actual: draft.proteinG,
    target: targets?.targetProteinG ?? null,
  })

  return (
    <BottomSheet open={open} onOpenChange={(v) => !v && onClose()} title={formatDate(date)}>
      <div className="space-y-4 p-4">
        <Field
          label="Kalorie"
          value={draft.kcalActual}
          target={targets?.targetKcal ?? null}
          unit="kcal"
          tone={kcalClass === 'hit' ? 'success' : kcalClass === 'miss' ? 'danger' : 'muted'}
          max={15000}
          onChange={(v) => setDraft({ ...draft, kcalActual: v })}
        />
        <Field
          label="Protein"
          value={draft.proteinG}
          target={targets?.targetProteinG ?? null}
          unit="g"
          tone={
            proteinClass === 'hit'
              ? 'success'
              : proteinClass === 'miss'
                ? 'danger'
                : proteinClass === 'near'
                  ? 'warn'
                  : 'muted'
          }
          max={2000}
          onChange={(v) => setDraft({ ...draft, proteinG: v })}
        />

        {(trackedMacros.includes('carbs') ||
          trackedMacros.includes('fat') ||
          trackedMacros.includes('sugar')) && (
          <div className="bg-background rounded-lg p-3">
            <div className="text-muted mb-2 text-[11px]">Volitelná makra</div>
            <div className="grid grid-cols-2 gap-2">
              {trackedMacros.includes('carbs') && (
                <SimpleMacro
                  label="Sacharidy"
                  value={draft.carbsG}
                  max={2000}
                  onChange={(v) => setDraft({ ...draft, carbsG: v })}
                />
              )}
              {trackedMacros.includes('fat') && (
                <SimpleMacro
                  label="Tuky"
                  value={draft.fatG}
                  max={1000}
                  onChange={(v) => setDraft({ ...draft, fatG: v })}
                />
              )}
              {trackedMacros.includes('sugar') && (
                <SimpleMacro
                  label="Cukry"
                  value={draft.sugarG}
                  max={2000}
                  onChange={(v) => setDraft({ ...draft, sugarG: v })}
                />
              )}
            </div>
          </div>
        )}

        <div>
          <div className="text-muted mb-1.5 text-xs">Poznámka</div>
          <textarea
            value={draft.note ?? ''}
            onChange={(e) => setDraft({ ...draft, note: e.target.value || null })}
            className="border-border bg-background text-foreground min-h-[40px] w-full rounded-lg border p-2.5 text-sm"
            rows={2}
          />
        </div>

        <button
          type="button"
          onClick={save}
          className="bg-primary text-background w-full rounded-lg py-2.5 font-semibold"
        >
          Uložit
        </button>
      </div>
    </BottomSheet>
  )
}

function Field({
  label,
  value,
  target,
  unit,
  tone,
  max,
  onChange,
}: {
  label: string
  value: number | null
  target: number | null
  unit: string
  tone: 'success' | 'danger' | 'warn' | 'muted'
  max: number
  onChange: (v: number | null) => void
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-muted text-xs">{label}</span>
        <NumberInput
          value={value}
          onChange={onChange}
          step={1}
          min={0}
          max={max}
          suffix={target ? ` / ${target} ${unit}` : ` ${unit}`}
        />
      </div>
      <ProgressBar value={value} max={target} tone={tone} />
    </div>
  )
}

function SimpleMacro({
  label,
  value,
  max,
  onChange,
}: {
  label: string
  value: number | null
  max: number
  onChange: (v: number | null) => void
}) {
  return (
    <div>
      <div className="text-muted text-[11px]">{label}</div>
      <NumberInput value={value} onChange={onChange} step={1} min={0} max={max} suffix=" g" />
    </div>
  )
}

function formatDate(d: string): string {
  return new Date(d + 'T00:00:00Z').toLocaleDateString('cs-CZ', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
}
