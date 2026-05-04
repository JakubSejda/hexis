'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button, useToast } from '@/components/ui'
import { HabitDailyRow } from './HabitDailyRow'
import { HabitWeeklyRow } from './HabitWeeklyRow'
import { HabitDialog } from './HabitDialog'
import type { HabitWithStreak } from '@/lib/queries/habits'

type Props = {
  initialHabits: HabitWithStreak[]
  initialArchived: Array<Omit<HabitWithStreak, 'archivedAt'> & { archivedAt: string | Date | null }>
}

function getTzOffsetHeader(): Record<string, string> {
  if (typeof window === 'undefined') return {}
  return { 'X-User-Tz-Offset': String(new Date().getTimezoneOffset()) }
}

function todayYmd(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

export function HabitsPageClient({ initialHabits, initialArchived }: Props) {
  const router = useRouter()
  const toast = useToast()
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<HabitWithStreak | null>(null)
  const [archiveOpen, setArchiveOpen] = useState(false)
  const [localChecks, setLocalChecks] = useState<Record<number, boolean>>({})

  const daily = initialHabits.filter((h) => h.cadence === 'daily')
  const weekly = initialHabits.filter((h) => h.cadence === 'weekly')

  const isCheckedToday = (h: HabitWithStreak) =>
    h.id in localChecks ? (localChecks[h.id] ?? false) : h.completedToday

  const handleCheck = async (id: number) => {
    setLocalChecks((s) => ({ ...s, [id]: true }))
    const res = await fetch(`/api/habits/${id}/check`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...getTzOffsetHeader() },
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
      headers: getTzOffsetHeader(),
    })
    if (!res.ok) {
      setLocalChecks((s) => ({ ...s, [id]: true }))
      toast.show('Nepodařilo se vrátit', 'error')
      return
    }
    toast.show('Vráceno', 'info')
    router.refresh()
  }

  const handleCreate = async (payload: {
    name: string
    cadence: 'daily' | 'weekly'
    weeklyTarget: number | undefined
    weight: 'light' | 'standard' | 'heavy'
  }) => {
    const res = await fetch('/api/habits', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const json = await res.json().catch(() => null)
      toast.show(
        json?.error === 'Duplicate name'
          ? 'Návyk s tímto názvem už existuje'
          : 'Nepodařilo se vytvořit',
        'error'
      )
      return
    }
    setCreating(false)
    router.refresh()
  }

  const handleEdit = async (payload: { name: string; weight: 'light' | 'standard' | 'heavy' }) => {
    if (!editing) return
    const res = await fetch(`/api/habits/${editing.id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      toast.show('Nepodařilo se uložit', 'error')
      return
    }
    setEditing(null)
    router.refresh()
  }

  if (initialHabits.length === 0 && initialArchived.length === 0) {
    return (
      <div className="space-y-4 py-12 text-center">
        <p className="text-muted text-sm">Zatím nemáš žádné návyky.</p>
        <Button onClick={() => setCreating(true)}>+ Založ první návyk</Button>
        <p className="text-muted text-xs">Tap = check, drž = vrátit zpět.</p>
        <HabitDialog
          open={creating}
          mode="create"
          onClose={() => setCreating(false)}
          onSubmit={handleCreate}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={() => setCreating(true)}>+ Nový</Button>
      </div>

      {daily.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-muted text-xs tracking-[0.2em] uppercase">Daily</h2>
          <div className="space-y-2">
            {daily.map((h) => (
              <HabitDailyRow
                key={h.id}
                habit={{ ...h, completedToday: isCheckedToday(h) }}
                onCheck={handleCheck}
                onUncheck={handleUncheck}
              />
            ))}
          </div>
        </section>
      )}

      {weekly.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-muted text-xs tracking-[0.2em] uppercase">Weekly</h2>
          <div className="space-y-2">
            {weekly.map((h) => (
              <HabitWeeklyRow
                key={h.id}
                habit={{
                  id: h.id,
                  name: h.name,
                  weight: h.weight,
                  weeklyTarget: h.weeklyTarget ?? 1,
                  completedThisWeek: h.completedThisWeek ?? 0,
                  completedToday: isCheckedToday(h),
                  currentStreak: h.currentStreak,
                }}
                onCheck={handleCheck}
              />
            ))}
          </div>
        </section>
      )}

      {initialArchived.length > 0 && (
        <section className="space-y-2">
          <button
            type="button"
            onClick={() => setArchiveOpen((s) => !s)}
            className="text-muted flex w-full items-center justify-between text-xs tracking-[0.2em] uppercase"
          >
            <span>Archive ({initialArchived.length})</span>
            <span>{archiveOpen ? '▲' : '▼'}</span>
          </button>
          {archiveOpen && (
            <div className="space-y-2 opacity-60">
              {initialArchived.map((h) => (
                <div
                  key={h.id}
                  data-archived-row
                  className="border-border bg-surface flex items-center gap-3 rounded-lg border px-3 py-2.5"
                >
                  <span className="flex-1 text-sm">{h.name}</span>
                  <span className="text-muted text-xs">🔥 {h.currentStreak}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      <HabitDialog
        open={creating}
        mode="create"
        onClose={() => setCreating(false)}
        onSubmit={handleCreate}
      />
      {editing && (
        <HabitDialog
          open
          mode="edit"
          habit={editing}
          onClose={() => setEditing(null)}
          onSubmit={handleEdit}
        />
      )}
    </div>
  )
}
