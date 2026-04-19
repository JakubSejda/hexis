'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useXpFeedback } from '@/components/xp/XpFeedbackProvider'

type Props = {
  sessionId: number
  totalSets: number
  totalVolume: number
  durationMin: number
  note: string | null
}

export function SessionSummary({
  sessionId,
  totalSets,
  totalVolume,
  durationMin,
  note: initialNote,
}: Props) {
  const router = useRouter()
  const { notifyXp } = useXpFeedback()
  const [note, setNote] = useState(initialNote ?? '')
  const [saving, setSaving] = useState(false)

  const finish = async () => {
    setSaving(true)
    const res = await fetch(`/api/sessions/${sessionId}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ finishedAt: true, note: note || null }),
    })
    if (res.ok) {
      const body = await res.json()
      notifyXp(body)
    }
    router.push('/dashboard')
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      <h2 className="text-lg">Shrnuti</h2>
      <div className="grid grid-cols-3 gap-2 text-center">
        <Stat label="Serii" value={String(totalSets)} />
        <Stat label="Tuny" value={`${(totalVolume / 1000).toFixed(1)}`} />
        <Stat label="Cas" value={`${durationMin} min`} />
      </div>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Poznamka (volitelne)"
        className="border-border bg-background min-h-[80px] rounded-lg border p-2 text-sm"
      />
      <button
        type="button"
        onClick={finish}
        disabled={saving}
        className="bg-primary text-background h-12 rounded-lg font-semibold"
      >
        {saving ? 'Ukladam...' : 'Dokoncit trenink'}
      </button>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface rounded-md p-2">
      <div className="text-primary text-lg font-bold">{value}</div>
      <div className="text-muted text-xs">{label}</div>
    </div>
  )
}
