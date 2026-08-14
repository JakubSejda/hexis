import { redirect } from 'next/navigation'
import { and, desc, eq, isNotNull } from 'drizzle-orm'
import { db } from '@/db/client'
import { requireSessionUser } from '@/lib/auth-helpers'
import { plans, sessions } from '@/db/schema'
import {
  fetchSessionDatesInRange,
  fetchHabitDatesInRange,
  fetchMeasurementDatesInRange,
  fetchPhotoDatesInRange,
} from '@/lib/queries/calendar'
import { composeCalendarMonth } from '@/lib/calendar/compose'
import { detectTrainingStreaks } from '@/lib/calendar/streaks'
import { Button, Container, Stack } from '@/components/ui'
import { CalendarHeader, CalendarGridClient, CalendarLegend } from '@/components/calendar'

export const dynamic = 'force-dynamic'

const YM = /^\d{4}-\d{2}$/

function todayYmdUtc(now: Date): string {
  const y = now.getUTCFullYear()
  const m = String(now.getUTCMonth() + 1).padStart(2, '0')
  const d = String(now.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function ymOfDate(date: string): string {
  return date.slice(0, 7)
}

function monthBounds(ym: string): { from: string; to: string } {
  const y = Number(ym.slice(0, 4))
  const m0 = Number(ym.slice(5, 7)) - 1
  const last = new Date(Date.UTC(y, m0 + 1, 0)).getUTCDate()
  return {
    from: `${ym}-01`,
    to: `${ym}-${String(last).padStart(2, '0')}`,
  }
}

type Search = { ym?: string }

export default async function CalendarPage({ searchParams }: { searchParams: Promise<Search> }) {
  const user = await requireSessionUser()
  if (user instanceof Response) redirect('/login')

  const sp = await searchParams
  const now = new Date()
  const today = todayYmdUtc(now)
  const currentYm = ymOfDate(today)
  const ym = sp.ym && YM.test(sp.ym) ? sp.ym : currentYm
  const { from, to } = monthBounds(ym)

  const [sessionDates, habitDates, weighDates, photoDates, userPlans, lastFinishedRow] =
    await Promise.all([
      fetchSessionDatesInRange(db, user.id, from, to),
      fetchHabitDatesInRange(db, user.id, from, to),
      fetchMeasurementDatesInRange(db, user.id, from, to),
      fetchPhotoDatesInRange(db, user.id, from, to),
      db.select().from(plans).where(eq(plans.userId, user.id)),
      db
        .select({ planId: sessions.planId, finishedAt: sessions.finishedAt })
        .from(sessions)
        .where(and(eq(sessions.userId, user.id), isNotNull(sessions.finishedAt)))
        .orderBy(desc(sessions.finishedAt))
        .limit(1),
    ])

  const lastFinishedPlanId = lastFinishedRow[0]?.planId ?? null

  const isEmptyUser =
    sessionDates.size === 0 &&
    habitDates.size === 0 &&
    weighDates.size === 0 &&
    photoDates.size === 0 &&
    userPlans.length === 0 &&
    lastFinishedRow.length === 0

  const days = composeCalendarMonth({
    ym,
    today,
    sessionDates,
    habitDates,
    weighDates,
    photoDates,
    lastFinishedPlanId,
    plans: userPlans.map((p) => ({ id: p.id, name: p.name, order: p.order })),
  })
  detectTrainingStreaks(days)

  return (
    <Container>
      <Stack gap={4} className="py-6">
        <CalendarHeader ym={ym} currentYm={currentYm} />
        <CalendarGridClient days={days} />
        {isEmptyUser && (
          <div className="space-y-3 text-center">
            <p className="text-muted text-sm">
              Začni svoji cestu — první session, habit nebo váha se tu objeví.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <Button as="a" href="/training" variant="outline" size="sm">
                Začni trénink
              </Button>
              <Button as="a" href="/habits" variant="outline" size="sm">
                Vytvoř návyk
              </Button>
              <Button as="a" href="/progress" variant="outline" size="sm">
                Zapiš váhu
              </Button>
            </div>
          </div>
        )}
        <CalendarLegend />
      </Stack>
    </Container>
  )
}
