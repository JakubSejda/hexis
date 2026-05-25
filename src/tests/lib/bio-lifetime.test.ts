import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { like, inArray } from 'drizzle-orm'
import { db } from '@/db/client'
import { sessions, sessionSets, xpEvents, users } from '@/db/schema'
import { fetchLifetimeTotals } from '@/lib/bio-lifetime'

const PREFIX = 'biolt_'
const USER = `${PREFIX}user00000000000001`
const OTHER = `${PREFIX}user00000000000002`

async function cleanup() {
  const owned = await db
    .select({ id: sessions.id })
    .from(sessions)
    .where(like(sessions.userId, `${PREFIX}%`))
  const ids = owned.map((r) => r.id)
  if (ids.length) {
    await db.delete(sessionSets).where(inArray(sessionSets.sessionId, ids))
  }
  await db.delete(sessions).where(like(sessions.userId, `${PREFIX}%`))
  await db.delete(xpEvents).where(like(xpEvents.userId, `${PREFIX}%`))
  await db.delete(users).where(like(users.id, `${PREFIX}%`))
}

beforeAll(cleanup)
afterAll(cleanup)

beforeEach(async () => {
  await cleanup()
  await db.insert(users).values([
    { id: USER, email: `${PREFIX}lt@hexis.local` },
    { id: OTHER, email: `${PREFIX}other@hexis.local` },
  ])
})

describe('fetchLifetimeTotals', () => {
  it('returns zeroes for fresh user', async () => {
    expect(await fetchLifetimeTotals(db, USER)).toEqual({
      sessions: 0,
      sets: 0,
      liftedKg: 0,
      totalXp: 0,
    })
  })

  it('counts only finished sessions', async () => {
    const [a] = (await db.insert(sessions).values({
      userId: USER,
      startedAt: new Date('2024-01-01T10:00:00Z'),
      finishedAt: new Date('2024-01-01T11:00:00Z'),
    })) as unknown as [{ insertId: number }]
    await db.insert(sessions).values({
      userId: USER,
      startedAt: new Date('2024-01-02T10:00:00Z'),
      finishedAt: null,
    })
    await db.insert(sessionSets).values([
      { sessionId: a.insertId, exerciseId: 1, setIndex: 0, weightKg: '100.00', reps: 5 },
      { sessionId: a.insertId, exerciseId: 1, setIndex: 1, weightKg: '100.00', reps: 5 },
    ])
    const totals = await fetchLifetimeTotals(db, USER)
    expect(totals.sessions).toBe(1)
    expect(totals.sets).toBe(2)
    expect(totals.liftedKg).toBe(1000)
  })

  it('ignores sets with null weight or null reps in liftedKg sum', async () => {
    const [a] = (await db.insert(sessions).values({
      userId: USER,
      startedAt: new Date('2024-01-01T10:00:00Z'),
      finishedAt: new Date('2024-01-01T11:00:00Z'),
    })) as unknown as [{ insertId: number }]
    await db.insert(sessionSets).values([
      { sessionId: a.insertId, exerciseId: 1, setIndex: 0, weightKg: '50.00', reps: 10 },
      { sessionId: a.insertId, exerciseId: 1, setIndex: 1, weightKg: null, reps: 10 },
      { sessionId: a.insertId, exerciseId: 1, setIndex: 2, weightKg: '50.00', reps: null },
    ])
    const totals = await fetchLifetimeTotals(db, USER)
    expect(totals.sets).toBe(3)
    expect(totals.liftedKg).toBe(500)
  })

  it('sums xp from xp_events', async () => {
    await db.insert(xpEvents).values([
      { userId: USER, eventType: 'session_complete', xpDelta: 50 },
      { userId: USER, eventType: 'set_logged', xpDelta: 10 },
      { userId: USER, eventType: 'habit_streak', xpDelta: 100 },
    ])
    const totals = await fetchLifetimeTotals(db, USER)
    expect(totals.totalXp).toBe(160)
  })

  it('scopes by userId', async () => {
    const [a] = (await db.insert(sessions).values({
      userId: OTHER,
      startedAt: new Date('2024-01-01T10:00:00Z'),
      finishedAt: new Date('2024-01-01T11:00:00Z'),
    })) as unknown as [{ insertId: number }]
    await db.insert(sessionSets).values({
      sessionId: a.insertId,
      exerciseId: 1,
      setIndex: 0,
      weightKg: '100.00',
      reps: 5,
    })
    expect(await fetchLifetimeTotals(db, USER)).toEqual({
      sessions: 0,
      sets: 0,
      liftedKg: 0,
      totalXp: 0,
    })
  })
})
