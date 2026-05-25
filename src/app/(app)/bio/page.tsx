import { redirect } from 'next/navigation'
import { db } from '@/db/client'
import { requireSessionUser } from '@/lib/auth-helpers'
import { fetchProfile } from '@/lib/queries/profile'
import { fetchLatestMeasurement, fetchFirstMeasurement } from '@/lib/queries/measurements'
import { fetchLifetimeTotals } from '@/lib/bio-lifetime'
import { listPhotos } from '@/lib/queries/photos'
import { getTotalXp } from '@/lib/xp'
import { xpToLevel } from '@/lib/xp-events'
import { levelToTier, levelToTierMeta } from '@/lib/tiers'
import { ageFromBirthDate } from '@/lib/bio-age'
import { Container, Stack } from '@/components/ui'
import { RegionHeader } from '@/components/dashboard/RegionHeader'
import {
  BioHero,
  VitalsStrip,
  GoalCard,
  LifetimeTotals,
  TransformationStrip,
} from '@/components/bio'

export const dynamic = 'force-dynamic'

export default async function BioPage() {
  const user = await requireSessionUser()
  if (user instanceof Response) redirect('/login')

  const today = new Date()
  const [profile, latest, first, totals, photosResult, totalXp] = await Promise.all([
    fetchProfile(db, user.id),
    fetchLatestMeasurement(db, user.id),
    fetchFirstMeasurement(db, user.id),
    fetchLifetimeTotals(db, user.id),
    listPhotos(db, user.id, { limit: 200 }),
    getTotalXp(db, user.id),
  ])

  const level = xpToLevel(totalXp)
  const tier = levelToTier(level)
  const tierMeta = levelToTierMeta(level)
  const age = ageFromBirthDate(profile?.birthDate ?? null, today)

  const photos = [...photosResult.items].reverse().map((p) => ({
    id: p.id,
    takenAt: p.takenAt,
    pose: p.pose,
    fullUrl: `/api/photos/${p.id}`,
    thumbUrl: `/api/photos/${p.id}/thumb`,
    weightKg: null as number | null,
  }))

  return (
    <Container>
      <Stack gap={6} className="py-4">
        <BioHero
          name={profile?.name ?? null}
          tier={tier}
          tierName={tierMeta.name}
          level={level}
          startedAt={profile?.startedAt ?? null}
          today={today}
        />

        <section>
          <RegionHeader>Vitals</RegionHeader>
          <VitalsStrip
            heightCm={profile?.heightCm ?? null}
            age={age}
            gender={profile?.gender ?? null}
            weightKg={latest?.weightKg ? Number(latest.weightKg) : null}
          />
        </section>

        <section>
          <RegionHeader>Goal</RegionHeader>
          <GoalCard
            goalKg={profile?.goalKg ? Number(profile.goalKg) : null}
            goalText={profile?.goalText ?? null}
            currentWeightKg={latest?.weightKg ? Number(latest.weightKg) : null}
            startedWeightKg={first?.weightKg ? Number(first.weightKg) : null}
          />
        </section>

        <section>
          <RegionHeader>Lifetime</RegionHeader>
          <LifetimeTotals
            sessions={totals.sessions}
            sets={totals.sets}
            liftedKg={totals.liftedKg}
            totalXp={totals.totalXp}
          />
        </section>

        <section>
          <RegionHeader>Transformation</RegionHeader>
          <TransformationStrip photos={photos} />
        </section>
      </Stack>
    </Container>
  )
}
