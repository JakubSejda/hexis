'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Heading, Textarea } from '@/components/ui'
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
  const [celebration, setCelebration] = useState<number | null>(null)

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
      // QUEST SPLNĚN moment (Reforge R4) — brief HUD overlay before leaving.
      setCelebration(typeof body.xpDelta === 'number' ? body.xpDelta : 0)
      setTimeout(() => router.push('/dashboard'), 1800)
      return
    }
    router.push('/dashboard')
  }

  return (
    <div className="flex flex-col gap-3">
      {celebration !== null && (
        <div
          role="status"
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-black/80 backdrop-blur-sm"
        >
          <div className="animate-hud-power-on flex flex-col items-center gap-4">
            <div className="quest-orb border-accent grid size-48 place-items-center rounded-full border-2">
              <span className="font-display text-center leading-none font-black uppercase">
                <span className="text-accent block text-sm">Denní quest</span>
                <span className="mt-1 block text-3xl">Splněn</span>
              </span>
            </div>
            {celebration > 0 && (
              <div className="font-display text-reward text-3xl font-black">+{celebration} XP</div>
            )}
          </div>
        </div>
      )}
      <Heading level={2} className="text-lg">
        Shrnutí
      </Heading>
      <div className="grid grid-cols-3 gap-2 text-center">
        <Stat label="Sérií" value={String(totalSets)} />
        <Stat label="Tun" value={(totalVolume / 1000).toFixed(1).replace('.', ',')} />
        <Stat label="Minut" value={String(durationMin)} />
      </div>
      <Textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Poznámka (volitelné)…"
        rows={3}
        className="min-h-[80px]"
      />
      <Button variant="success" size="lg" loading={saving} onClick={finish}>
        Dokončit trénink
      </Button>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-card border-border bg-surface border px-2 py-3">
      <div className="text-foreground font-display text-2xl leading-none font-black">{value}</div>
      <div className="text-muted mt-1.5 text-[10px] font-bold tracking-[0.12em] uppercase">
        {label}
      </div>
    </div>
  )
}
