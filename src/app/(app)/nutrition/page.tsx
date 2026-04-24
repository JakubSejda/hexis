import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/db/client'
import { fetchRange, monthBounds } from '@/lib/queries/nutrition'
import { fetchRange as fetchMeasurements } from '@/lib/queries/measurements'
import { getMacros } from '@/lib/queries/user-prefs'
import { toWeekStart } from '@/lib/week'
import { NutritionPageClient } from '@/components/nutrition/NutritionPageClient'

export default async function NutritionPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const today = new Date()
  const month = `${today.getUTCFullYear()}-${String(today.getUTCMonth() + 1).padStart(2, '0')}`
  const { from, to } = monthBounds(month)

  const [days, macros, measurements] = await Promise.all([
    fetchRange(db, session.user.id, from, to),
    getMacros(db, session.user.id),
    fetchMeasurements(db, session.user.id, toWeekStart(new Date(from + 'T00:00:00Z')), to),
  ])

  const targetsByWeek: Record<
    string,
    {
      targetKcal: number | null
      targetProteinG: number | null
      targetCarbsG: number | null
      targetFatG: number | null
      targetSugarG: number | null
    }
  > = {}
  for (const m of measurements) {
    targetsByWeek[m.weekStart] = {
      targetKcal: m.targetKcal ?? null,
      targetProteinG: m.targetProteinG ?? null,
      targetCarbsG: m.targetCarbsG ?? null,
      targetFatG: m.targetFatG ?? null,
      targetSugarG: m.targetSugarG ?? null,
    }
  }

  return (
    <NutritionPageClient
      initialMonth={month}
      initialDays={days.map((d) => ({
        id: d.id,
        date: d.date,
        kcalActual: d.kcalActual ?? null,
        proteinG: d.proteinG ?? null,
        carbsG: d.carbsG ?? null,
        fatG: d.fatG ?? null,
        sugarG: d.sugarG ?? null,
        note: d.note ?? null,
      }))}
      trackedMacros={macros}
      targetsByWeek={targetsByWeek}
    />
  )
}
