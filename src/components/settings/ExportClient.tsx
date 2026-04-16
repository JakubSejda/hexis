'use client'

import { useState } from 'react'
import { toCsv } from '@/lib/csv'

type Status = 'idle' | 'fetching' | 'zipping' | 'done' | 'error'

export function ExportClient() {
  const [status, setStatus] = useState<Status>('idle')

  const handleExport = async () => {
    try {
      setStatus('fetching')

      const [sessionsRes, setsRes, measurementsRes, nutritionRes] = await Promise.all([
        fetch('/api/sessions?limit=9999').then((r) => r.json()),
        fetch('/api/export/sets').then((r) => r.json()),
        fetch('/api/measurements?all=true').then((r) => r.json()),
        fetch('/api/nutrition?all=true').then((r) => r.json()),
      ])

      setStatus('zipping')

      const { default: JSZip } = await import('jszip')
      const { saveAs } = await import('file-saver')

      const zip = new JSZip()

      zip.file(
        'sessions.csv',
        toCsv(
          (sessionsRes.items ?? []).map((s: Record<string, unknown>) => ({
            id: s.id,
            plan_name: s.planName ?? '',
            started_at: s.startedAt,
            finished_at: s.finishedAt ?? '',
            note: s.note ?? '',
            set_count: s.setCount ?? 0,
            volume_kg: s.volumeKg ?? 0,
          })),
          ['id', 'plan_name', 'started_at', 'finished_at', 'note', 'set_count', 'volume_kg']
        )
      )

      zip.file(
        'sets.csv',
        toCsv(
          (setsRes.sets ?? []).map((s: Record<string, unknown>) => ({
            id: s.id,
            session_id: s.session_id,
            exercise_name: s.exercise_name,
            set_index: s.set_index,
            weight_kg: s.weight_kg ?? '',
            reps: s.reps ?? '',
            rpe: s.rpe ?? '',
            completed_at: s.completed_at ?? '',
          })),
          [
            'id',
            'session_id',
            'exercise_name',
            'set_index',
            'weight_kg',
            'reps',
            'rpe',
            'completed_at',
          ]
        )
      )

      zip.file(
        'measurements.csv',
        toCsv(
          (measurementsRes.items ?? []).map((m: Record<string, unknown>) => ({
            week_start: m.weekStart,
            weight_kg: m.weightKg ?? '',
            waist_cm: m.waistCm ?? '',
            chest_cm: m.chestCm ?? '',
            thigh_cm: m.thighCm ?? '',
            biceps_cm: m.bicepsCm ?? '',
          })),
          ['week_start', 'weight_kg', 'waist_cm', 'chest_cm', 'thigh_cm', 'biceps_cm']
        )
      )

      zip.file(
        'nutrition.csv',
        toCsv(
          (nutritionRes.items ?? []).map((n: Record<string, unknown>) => ({
            date: n.date,
            kcal_actual: n.kcalActual ?? '',
            protein_g: n.proteinG ?? '',
            note: n.note ?? '',
          })),
          ['date', 'kcal_actual', 'protein_g', 'note']
        )
      )

      const blob = await zip.generateAsync({ type: 'blob' })
      const date = new Date().toISOString().slice(0, 10)
      saveAs(blob, `hexis-export-${date}.zip`)

      setStatus('done')
    } catch {
      setStatus('error')
    }
  }

  const label: Record<Status, string> = {
    idle: 'Stáhnout export',
    fetching: 'Načítám data…',
    zipping: 'Generuji ZIP…',
    done: 'Hotovo!',
    error: 'Chyba, zkus znovu',
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <h1 className="text-xl font-semibold">Export dat</h1>
      <p className="text-sm text-[#6b7280]">
        Stáhne ZIP archiv se všemi tvými daty ve formátu CSV (sessions, sets, measurements,
        nutrition).
      </p>
      <button
        onClick={handleExport}
        disabled={status === 'fetching' || status === 'zipping'}
        className="flex h-12 items-center justify-center rounded-lg bg-[#10b981] font-semibold text-[#0a0e14] disabled:opacity-50"
      >
        {label[status]}
      </button>
    </div>
  )
}
