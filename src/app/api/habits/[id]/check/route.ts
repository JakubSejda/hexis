import { db } from '@/db/client'
import { habits, habitCompletions } from '@/db/schema'
import { and, eq } from 'drizzle-orm'
import { requireSessionUser, requireOwnership } from '@/lib/auth-helpers'
import { habitCheckSchema } from '@/lib/validators/habits'
import { fetchHabitWithCompletions, hasMilestoneBeenAwarded } from '@/lib/queries/habits'
import { countConsecutiveDays, countConsecutiveClosedWeeks } from '@/lib/habits/streak'
import { detectMilestone, xpForMilestone } from '@/lib/habits/milestone'
import { resolveUserToday } from '@/lib/habits/tz'
import { awardXpVariable } from '@/lib/xp'

type Ctx = { params: Promise<{ id: string }> }

export async function POST(req: Request, ctx: Ctx) {
  const user = await requireSessionUser()
  if (user instanceof Response) return user
  const { id: idStr } = await ctx.params
  const id = Number(idStr)
  if (!Number.isInteger(id) || id <= 0) {
    return Response.json({ error: 'Invalid id' }, { status: 400 })
  }
  const habitRow = await requireOwnership(
    db.query.habits.findFirst({ where: eq(habits.id, id) }),
    user.id
  )
  if (habitRow instanceof Response) return habitRow

  const body = await req.json().catch(() => null)
  const parsed = habitCheckSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: 'Invalid body', issues: parsed.error.issues }, { status: 400 })
  }
  const { date } = parsed.data

  const today = resolveUserToday(req.headers.get('X-User-Tz-Offset'))
  if (date > today) {
    return Response.json({ error: 'date is in the future' }, { status: 400 })
  }

  await db
    .insert(habitCompletions)
    .values({ habitId: id, userId: user.id, completedOn: date })
    .onDuplicateKeyUpdate({ set: { habitId: id } })

  const habitWithDates = await fetchHabitWithCompletions(db, user.id, id)
  if (!habitWithDates) {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }
  const streak =
    habitWithDates.cadence === 'daily'
      ? countConsecutiveDays(habitWithDates.completionDates, today)
      : countConsecutiveClosedWeeks(
          habitWithDates.completionDates,
          habitWithDates.weeklyTarget ?? 1,
          today
        )

  let milestoneAwardedXp: number | undefined = undefined
  if (habitWithDates.cadence === 'daily') {
    const milestone = detectMilestone(streak)
    if (milestone) {
      const already = await hasMilestoneBeenAwarded(db, user.id, id, milestone)
      if (!already) {
        const delta = xpForMilestone(milestone, habitWithDates.weight)
        await awardXpVariable({
          db,
          userId: user.id,
          event: 'habit_streak',
          xpDelta: delta,
          meta: { habitId: id, milestone, weight: habitWithDates.weight },
        })
        milestoneAwardedXp = delta
      }
    }
  }

  return Response.json({ streak, milestoneAwardedXp }, { status: 201 })
}

export async function DELETE(req: Request, ctx: Ctx) {
  const user = await requireSessionUser()
  if (user instanceof Response) return user
  const { id: idStr } = await ctx.params
  const id = Number(idStr)
  if (!Number.isInteger(id) || id <= 0) {
    return Response.json({ error: 'Invalid id' }, { status: 400 })
  }
  const habitRow = await requireOwnership(
    db.query.habits.findFirst({ where: eq(habits.id, id) }),
    user.id
  )
  if (habitRow instanceof Response) return habitRow

  const url = new URL(req.url)
  const date = url.searchParams.get('date') ?? ''
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return Response.json({ error: 'date query param required (YYYY-MM-DD)' }, { status: 400 })
  }
  await db
    .delete(habitCompletions)
    .where(and(eq(habitCompletions.habitId, id), eq(habitCompletions.completedOn, date)))
  return new Response(null, { status: 204 })
}
