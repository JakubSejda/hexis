'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useToast } from '@/components/ui'
import { HabitDailyRow } from '@/components/habits/HabitDailyRow'
import type { HabitWithStreak } from '@/lib/queries/habits'

type Props = { dailyHabits: HabitWithStreak[] }

const MAX_VISIBLE = 5

function todayYmd(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

export function TodaysChecksCard({ dailyHabits }: Props) {
  const router = useRouter()
  const toast = useToast()
  const [localChecks, setLocalChecks] = useState<Record<number, boolean>>({})

  if (dailyHabits.length === 0) return null

  const visible = dailyHabits.slice(0, MAX_VISIBLE)
  const overflow = dailyHabits.length - visible.length
  const isChecked = (h: HabitWithStreak) =>
    h.id in localChecks ? (localChecks[h.id] ?? false) : h.completedToday
  const doneCount = dailyHabits.filter((h) => isChecked(h)).length

  const handleCheck = async (id: number) => {
    setLocalChecks((s) => ({ ...s, [id]: true }))
    const res = await fetch(`/api/habits/${id}/check`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'X-User-Tz-Offset': String(new Date().getTimezoneOffset()),
      },
      body: JSON.stringify({ date: todayYmd() }),
    })
    if (!res.ok) {
      setLocalChecks((s) => ({ ...s, [id]: false }))
      toast.show('Nepodařilo se uložit', 'error')
      return
    }
    const json = await res.json()
    if (typeof json.milestoneAwardedXp === 'number') {
      toast.show(`🔥 Streak ${json.streak} dní!  +${json.milestoneAwardedXp} XP`, 'success')
    }
    router.refresh()
  }

  const handleUncheck = async (id: number) => {
    setLocalChecks((s) => ({ ...s, [id]: false }))
    const res = await fetch(`/api/habits/${id}/check?date=${todayYmd()}`, {
      method: 'DELETE',
      headers: { 'X-User-Tz-Offset': String(new Date().getTimezoneOffset()) },
    })
    if (!res.ok) {
      setLocalChecks((s) => ({ ...s, [id]: true }))
      toast.show('Nepodařilo se vrátit', 'error')
      return
    }
    toast.show('Vráceno', 'info')
    router.refresh()
  }

  return (
    <section
      data-todays-checks-card
      className="border-border bg-surface space-y-3 rounded-xl border p-4"
    >
      <h2 className="text-muted text-xs tracking-[0.2em] uppercase">Today&apos;s Checks</h2>
      <div className="space-y-2">
        {visible.map((h) => (
          <HabitDailyRow
            key={h.id}
            habit={{ ...h, completedToday: isChecked(h) }}
            onCheck={handleCheck}
            onUncheck={handleUncheck}
          />
        ))}
      </div>
      {overflow > 0 && <p className="text-muted text-xs">…a {overflow} další</p>}
      <div className="border-border flex items-center justify-between border-t pt-3 text-xs">
        <span className="text-muted tabular-nums">
          {doneCount} ze {dailyHabits.length} hotovo
        </span>
        <Link href="/habits" className="text-primary hover:underline">
          Otevřít
        </Link>
      </div>
    </section>
  )
}
