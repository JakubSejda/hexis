import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/db/client'
import { fetchRange } from '@/lib/queries/measurements'
import { weekRange } from '@/lib/week'
import { Container, Stack } from '@/components/ui'
import { MeasurementGrid } from '@/components/measurements/MeasurementGrid'
import { ProgressTabs } from '@/components/progress/ProgressTabs'
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
    <Container>
      <Stack gap={4} className="py-4">
        <ProgressTabs active="/progress" />
        {initialRows.every((row) => row.weightKg == null) ? (
          <div className="rounded-card border-accent/60 bg-surface border p-5">
            <div className="font-display text-xl leading-tight font-black uppercase">
              První měření
            </div>
            <p className="text-muted mt-2 text-sm">
              Klepni do řádku tohoto týdne a zapiš váhu. Pas a hrudník stačí jednou týdně, ve stejný
              den ráno. Každé měření +20 XP.
            </p>
          </div>
        ) : null}
        <div
          tabIndex={0}
          aria-label="Trendy měr za 8 týdnů"
          className="focus-visible:ring-ring rounded-control flex gap-2 overflow-x-auto pb-2 focus-visible:ring-2 focus-visible:outline-none"
        >
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
      </Stack>
    </Container>
  )
}
