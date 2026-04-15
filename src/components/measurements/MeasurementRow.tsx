'use client'

import { useState } from 'react'
import { MeasurementCell } from './MeasurementCell'
import { calcDelta, deltaDirection } from '@/lib/measurement-delta'

export type MeasurementValues = {
  weightKg: number | null
  waistCm: number | null
  chestCm: number | null
  thighCm: number | null
  bicepsCm: number | null
  targetKcal: number | null
  note: string | null
}

type Props = {
  weekStart: string
  isCurrent: boolean
  values: MeasurementValues
  prevWeightKg: number | null
  onCommitValue: (key: keyof MeasurementValues, value: number | null) => Promise<void>
  onCommitNote: (note: string | null) => Promise<void>
}

const DELTA_COLOR = {
  good: '#10b981',
  bad: '#ef4444',
  neutral: '#6b7280',
}

export function MeasurementRow({
  weekStart,
  isCurrent,
  values,
  prevWeightKg,
  onCommitValue,
  onCommitNote,
}: Props) {
  const [showNote, setShowNote] = useState(false)
  const [draftNote, setDraftNote] = useState(values.note ?? '')
  const delta = calcDelta(values.weightKg, prevWeightKg)
  const dir = deltaDirection(delta, 'lower-is-good')
  const dateLabel = formatWeekLabel(weekStart)

  return (
    <>
      <tr
        className={
          isCurrent ? 'border-b border-[#1f2733] bg-[#141a22]' : 'border-b border-[#1f2733]'
        }
      >
        <td
          className={
            'px-1.5 py-2.5 text-xs whitespace-nowrap ' +
            (isCurrent ? 'font-semibold text-[#10b981]' : 'text-[#6b7280]')
          }
        >
          <button onClick={() => setShowNote((s) => !s)}>{dateLabel}</button>
        </td>
        <td className="px-1.5 py-2.5">
          <MeasurementCell
            value={values.weightKg}
            precision={2}
            onCommit={(v) => onCommitValue('weightKg', v)}
          />
        </td>
        <td className="px-1.5 py-2.5 text-right text-xs" style={{ color: DELTA_COLOR[dir] }}>
          {delta == null ? '—' : delta > 0 ? `+${delta.toFixed(2)}` : delta.toFixed(2)}
        </td>
        <td className="px-1.5 py-2.5">
          <MeasurementCell
            value={values.waistCm}
            precision={1}
            onCommit={(v) => onCommitValue('waistCm', v)}
          />
        </td>
        <td className="px-1.5 py-2.5">
          <MeasurementCell
            value={values.chestCm}
            precision={1}
            onCommit={(v) => onCommitValue('chestCm', v)}
          />
        </td>
        <td className="px-1.5 py-2.5">
          <MeasurementCell
            value={values.thighCm}
            precision={1}
            onCommit={(v) => onCommitValue('thighCm', v)}
          />
        </td>
        <td className="px-1.5 py-2.5">
          <MeasurementCell
            value={values.bicepsCm}
            precision={1}
            onCommit={(v) => onCommitValue('bicepsCm', v)}
          />
        </td>
        <td className="px-1.5 py-2.5">
          <MeasurementCell
            value={values.targetKcal}
            precision={0}
            align="right"
            onCommit={(v) => onCommitValue('targetKcal', v)}
          />
        </td>
      </tr>
      {showNote && (
        <tr className="border-b border-[#1f2733]">
          <td colSpan={8} className="px-3 py-2">
            <textarea
              value={draftNote}
              onChange={(e) => setDraftNote(e.target.value)}
              onBlur={() => void onCommitNote(draftNote.trim() === '' ? null : draftNote)}
              placeholder="Poznámka k týdnu…"
              className="w-full rounded border border-[#1f2733] bg-[#0a0e14] p-2 text-sm text-[#e5e7eb] outline-none"
              rows={2}
            />
          </td>
        </tr>
      )}
    </>
  )
}

function formatWeekLabel(weekStart: string): string {
  const [, m, d] = weekStart.split('-').map(Number)
  return `${d}. ${m}.`
}
