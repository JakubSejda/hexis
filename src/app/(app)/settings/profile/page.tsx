import { redirect } from 'next/navigation'
import { db } from '@/db/client'
import { requireSessionUser } from '@/lib/auth-helpers'
import { fetchProfile } from '@/lib/queries/profile'
import { Container, Heading, Stack } from '@/components/ui'
import { ProfileFormClient } from './ProfileFormClient'

export const dynamic = 'force-dynamic'

export default async function ProfileSettingsPage() {
  const user = await requireSessionUser()
  if (user instanceof Response) redirect('/login')

  const profile = await fetchProfile(db, user.id)
  return (
    <Container>
      <Stack gap={4} className="py-6">
        <Heading level={1}>Profile</Heading>
        <ProfileFormClient
          initial={{
            name: profile?.name ?? null,
            birthDate: profile?.birthDate ?? null,
            gender: profile?.gender ?? null,
            heightCm: profile?.heightCm ?? null,
            goalKg:
              profile?.goalKg === null || profile?.goalKg === undefined
                ? null
                : Number(profile.goalKg),
            goalText: profile?.goalText ?? null,
            startedAt: profile?.startedAt ?? null,
          }}
        />
      </Stack>
    </Container>
  )
}
