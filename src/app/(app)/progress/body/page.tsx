import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/db/client'
import { fetchRange } from '@/lib/queries/measurements'
import { weekRange } from '@/lib/week'
import { MeasurementGrid } from '@/components/measurements/MeasurementGrid'
import { SparklineCard } from '@/components/measurements/SparklineCard'

export default async function BodyPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const weeks = weekRange(new Date(), 8)
  const rows = await fetchRange(db, session.user.id, weeks[0]!, weeks[weeks.length - 1]!)

  const byWeek = new Map(rows.map((r) => [r.weekStart, r]))
  const series = (key: 'weightKg' | 'waistCm' | 'chestCm' | 'thighCm' | 'bicepsCm') =>
    weeks.map((w) => {
      const v = byWeek.get(w)?.[key]
      return v == null ? null : Number(v)
    })

  const initialRows = rows.map((r) => ({
    id: r.id,
    weekStart: r.weekStart,
    weightKg: r.weightKg ?? null,
    waistCm: r.waistCm ?? null,
    chestCm: r.chestCm ?? null,
    thighCm: r.thighCm ?? null,
    bicepsCm: r.bicepsCm ?? null,
    targetKcal: r.targetKcal ?? null,
    note: r.note ?? null,
  }))

  return (
    <div className="space-y-3">
      <div className="flex gap-2 overflow-x-auto pb-2">
        <SparklineCard
          label="Váha"
          values={series('weightKg')}
          goal="lower-is-good"
          unit="kg"
          precision={1}
        />
        <SparklineCard
          label="Pas"
          values={series('waistCm')}
          goal="lower-is-good"
          unit="cm"
          precision={1}
        />
        <SparklineCard
          label="Hrudník"
          values={series('chestCm')}
          goal="higher-is-good"
          unit="cm"
          precision={1}
        />
        <SparklineCard
          label="Stehno"
          values={series('thighCm')}
          goal="higher-is-good"
          unit="cm"
          precision={1}
        />
        <SparklineCard
          label="Biceps"
          values={series('bicepsCm')}
          goal="higher-is-good"
          unit="cm"
          precision={1}
        />
      </div>
      <MeasurementGrid initialRows={initialRows} />
    </div>
  )
}
