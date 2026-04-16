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
        className="min-h-[80px] rounded-lg border border-[#1F2733] bg-[#0A0E14] p-2 text-sm"
      />
      <button
        type="button"
        onClick={finish}
        disabled={saving}
        className="h-12 rounded-lg bg-[#10B981] font-semibold text-[#0A0E14]"
      >
        {saving ? 'Ukladam...' : 'Dokoncit trenink'}
      </button>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-[#141A22] p-2">
      <div className="text-lg font-bold text-[#10B981]">{value}</div>
      <div className="text-xs text-[#6B7280]">{label}</div>
    </div>
  )
}
