import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { db } from '@/db/client'
import { requireSessionUser } from '@/lib/auth-helpers'
import { habits } from '@/db/schema'
import { and, desc, eq, isNotNull } from 'drizzle-orm'
import { fetchActiveHabitsWithStreak, type HabitWithStreak } from '@/lib/queries/habits'
import { resolveUserToday } from '@/lib/habits/tz'
import { Container, Heading, Stack } from '@/components/ui'
import { HabitsPageClient } from '@/components/habits/HabitsPageClient'

export const dynamic = 'force-dynamic'

export default async function HabitsPage() {
  const user = await requireSessionUser()
  if (user instanceof Response) {
    redirect('/login')
  }

  const h = await headers()
  const today = resolveUserToday(h.get('x-user-tz-offset'))

  const [active, archivedRows] = await Promise.all([
    fetchActiveHabitsWithStreak(db, user.id, today),
    db
      .select()
      .from(habits)
      .where(and(eq(habits.userId, user.id), isNotNull(habits.archivedAt)))
      .orderBy(desc(habits.archivedAt))
      .limit(50),
  ])

  const archived = archivedRows.map((r) => ({
    ...r,
    currentStreak: 0,
    completedToday: false,
  })) as Array<HabitWithStreak & { archivedAt: Date | null }>

  return (
    <Container as="main">
      <Stack gap={6} className="py-4">
        <Heading level={1}>Návyky</Heading>
        <HabitsPageClient initialHabits={active} initialArchived={archived} />
      </Stack>
    </Container>
  )
}
