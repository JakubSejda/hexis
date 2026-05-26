import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { like, inArray } from 'drizzle-orm'
import { db } from '@/db/client'
import {
  users,
  sessions,
  sessionSets,
  habits,
  habitCompletions,
  measurements,
  bodyPhotos,
} from '@/db/schema'
import * as schema from '@/db/schema'
import {
  fetchSessionDatesInRange,
  fetchHabitDatesInRange,
  fetchMeasurementDatesInRange,
  fetchPhotoDatesInRange,
} from '@/lib/queries/calendar'

const PREFIX = 'caltq_'
const USER = `${PREFIX}user00000000000001`
const OTHER = `${PREFIX}user00000000000002`

async function cleanup() {
  const owned = await db
    .select({ id: sessions.id })
    .from(sessions)
    .where(like(sessions.userId, `${PREFIX}%`))
  const sessionIds = owned.map((r) => r.id)
  if (sessionIds.length) {
    await db.delete(sessionSets).where(inArray(sessionSets.sessionId, sessionIds))
  }
  await db.delete(sessions).where(like(sessions.userId, `${PREFIX}%`))
  await db.delete(schema.plans).where(like(schema.plans.userId, `${PREFIX}%`))
  await db.delete(habitCompletions).where(like(habitCompletions.userId, `${PREFIX}%`))
  await db.delete(habits).where(like(habits.userId, `${PREFIX}%`))
  await db.delete(measurements).where(like(measurements.userId, `${PREFIX}%`))
  await db.delete(bodyPhotos).where(like(bodyPhotos.userId, `${PREFIX}%`))
  await db.delete(users).where(like(users.id, `${PREFIX}%`))
}

beforeAll(cleanup)
afterAll(cleanup)

beforeEach(async () => {
  await cleanup()
  await db.insert(users).values([
    { id: USER, email: `${PREFIX}u@hexis.local` },
    { id: OTHER, email: `${PREFIX}o@hexis.local` },
  ])
})

describe('fetchSessionDatesInRange', () => {
  it('returns empty Set for user with no sessions', async () => {
    const out = await fetchSessionDatesInRange(db, USER, '2026-05-01', '2026-05-31')
    expect(out).toEqual(new Set())
  })

  it('returns dates of finished sessions in range', async () => {
    await db.insert(sessions).values([
      {
        userId: USER,
        startedAt: new Date('2026-05-10T10:00:00Z'),
        finishedAt: new Date('2026-05-10T11:00:00Z'),
      },
      {
        userId: USER,
        startedAt: new Date('2026-05-12T10:00:00Z'),
        finishedAt: null,
      },
      {
        userId: USER,
        startedAt: new Date('2026-04-30T10:00:00Z'),
        finishedAt: new Date('2026-04-30T11:00:00Z'),
      },
    ])
    const out = await fetchSessionDatesInRange(db, USER, '2026-05-01', '2026-05-31')
    expect(out.has('2026-05-10')).toBe(true)
    expect(out.has('2026-05-12')).toBe(false)
    expect(out.has('2026-04-30')).toBe(false)
    expect(out.size).toBe(1)
  })

  it('scopes by userId', async () => {
    await db.insert(sessions).values({
      userId: OTHER,
      startedAt: new Date('2026-05-10T10:00:00Z'),
      finishedAt: new Date('2026-05-10T11:00:00Z'),
    })
    const out = await fetchSessionDatesInRange(db, USER, '2026-05-01', '2026-05-31')
    expect(out).toEqual(new Set())
  })

  it('includes the from and to bounds (inclusive)', async () => {
    await db.insert(sessions).values([
      {
        userId: USER,
        startedAt: new Date('2026-05-01T08:00:00Z'),
        finishedAt: new Date('2026-05-01T09:00:00Z'),
      },
      {
        userId: USER,
        startedAt: new Date('2026-05-31T22:00:00Z'),
        finishedAt: new Date('2026-05-31T23:30:00Z'),
      },
    ])
    const out = await fetchSessionDatesInRange(db, USER, '2026-05-01', '2026-05-31')
    expect(out.has('2026-05-01')).toBe(true)
    expect(out.has('2026-05-31')).toBe(true)
  })
})

describe('fetchHabitDatesInRange', () => {
  it('returns empty Set for user with no completions', async () => {
    const out = await fetchHabitDatesInRange(db, USER, '2026-05-01', '2026-05-31')
    expect(out).toEqual(new Set())
  })

  it('returns completion dates in range, scoped by userId', async () => {
    const [h1] = (await db.insert(habits).values({
      userId: USER,
      name: 'Voda',
      cadence: 'daily',
      weight: 'standard',
    })) as unknown as [{ insertId: number }]
    await db.insert(habitCompletions).values([
      { habitId: h1.insertId, userId: USER, completedOn: '2026-05-03' },
      { habitId: h1.insertId, userId: USER, completedOn: '2026-05-04' },
      { habitId: h1.insertId, userId: USER, completedOn: '2026-04-30' },
    ])
    const out = await fetchHabitDatesInRange(db, USER, '2026-05-01', '2026-05-31')
    expect(out.has('2026-05-03')).toBe(true)
    expect(out.has('2026-05-04')).toBe(true)
    expect(out.has('2026-04-30')).toBe(false)
    expect(out.size).toBe(2)
  })

  it('deduplicates multiple completions on the same date', async () => {
    const [h1] = (await db.insert(habits).values({
      userId: USER,
      name: 'Voda',
      cadence: 'daily',
      weight: 'standard',
    })) as unknown as [{ insertId: number }]
    const [h2] = (await db.insert(habits).values({
      userId: USER,
      name: 'Strečink',
      cadence: 'daily',
      weight: 'light',
    })) as unknown as [{ insertId: number }]
    await db.insert(habitCompletions).values([
      { habitId: h1.insertId, userId: USER, completedOn: '2026-05-03' },
      { habitId: h2.insertId, userId: USER, completedOn: '2026-05-03' },
    ])
    const out = await fetchHabitDatesInRange(db, USER, '2026-05-01', '2026-05-31')
    expect(out.size).toBe(1)
    expect(out.has('2026-05-03')).toBe(true)
  })
})

describe('fetchMeasurementDatesInRange', () => {
  it('returns weekStart dates in range', async () => {
    await db.insert(measurements).values([
      { userId: USER, weekStart: '2026-05-04', weightKg: '82.50' },
      { userId: USER, weekStart: '2026-05-11', weightKg: '82.00' },
      { userId: USER, weekStart: '2026-04-27', weightKg: '83.00' },
    ])
    const out = await fetchMeasurementDatesInRange(db, USER, '2026-05-01', '2026-05-31')
    expect(out).toEqual(new Set(['2026-05-04', '2026-05-11']))
  })

  it('scopes by userId', async () => {
    await db
      .insert(measurements)
      .values({ userId: OTHER, weekStart: '2026-05-04', weightKg: '70.00' })
    const out = await fetchMeasurementDatesInRange(db, USER, '2026-05-01', '2026-05-31')
    expect(out).toEqual(new Set())
  })
})

describe('fetchPhotoDatesInRange', () => {
  it('returns takenAt dates in range', async () => {
    await db.insert(bodyPhotos).values([
      {
        userId: USER,
        takenAt: '2026-05-04',
        weekStart: '2026-05-04',
        pose: 'front',
        storageKey: `${PREFIX}a`,
        widthPx: 100,
        heightPx: 100,
        byteSize: 1000,
      },
      {
        userId: USER,
        takenAt: '2026-04-30',
        weekStart: '2026-04-27',
        pose: 'front',
        storageKey: `${PREFIX}b`,
        widthPx: 100,
        heightPx: 100,
        byteSize: 1000,
      },
    ])
    const out = await fetchPhotoDatesInRange(db, USER, '2026-05-01', '2026-05-31')
    expect(out).toEqual(new Set(['2026-05-04']))
  })

  it('scopes by userId', async () => {
    await db.insert(bodyPhotos).values({
      userId: OTHER,
      takenAt: '2026-05-04',
      weekStart: '2026-05-04',
      pose: 'front',
      storageKey: `${PREFIX}o`,
      widthPx: 100,
      heightPx: 100,
      byteSize: 1000,
    })
    const out = await fetchPhotoDatesInRange(db, USER, '2026-05-01', '2026-05-31')
    expect(out).toEqual(new Set())
  })
})

import { fetchDayDetail } from '@/lib/queries/calendar'

describe('fetchDayDetail', () => {
  it('returns empty shape for a day with no signals', async () => {
    const out = await fetchDayDetail(db, USER, '2026-05-15')
    expect(out).toEqual({
      date: '2026-05-15',
      sessions: [],
      habits: [],
      measurement: null,
      photos: [],
    })
  })

  it('returns sessions finished that day with planName + durationMin', async () => {
    const [planRow] = (await db.insert(schema.plans).values({
      userId: USER,
      name: 'Plán A',
      slug: 'plan-a',
      order: 0,
    })) as unknown as [{ insertId: number }]
    const [s] = (await db.insert(sessions).values({
      userId: USER,
      planId: planRow.insertId,
      startedAt: new Date('2026-05-15T10:00:00Z'),
      finishedAt: new Date('2026-05-15T11:30:00Z'),
    })) as unknown as [{ insertId: number }]
    const out = await fetchDayDetail(db, USER, '2026-05-15')
    expect(out.sessions.length).toBe(1)
    expect(out.sessions[0]?.id).toBe(s.insertId)
    expect(out.sessions[0]?.planName).toBe('Plán A')
    expect(out.sessions[0]?.durationMin).toBe(90)
  })

  it('returns habits completed that day', async () => {
    const [h] = (await db.insert(habits).values({
      userId: USER,
      name: 'Voda',
      cadence: 'daily',
      weight: 'standard',
    })) as unknown as [{ insertId: number }]
    await db.insert(habitCompletions).values({
      habitId: h.insertId,
      userId: USER,
      completedOn: '2026-05-15',
    })
    const out = await fetchDayDetail(db, USER, '2026-05-15')
    expect(out.habits.length).toBe(1)
    expect(out.habits[0]?.name).toBe('Voda')
  })

  it('returns measurement keyed by weekStart === date', async () => {
    await db.insert(measurements).values({
      userId: USER,
      weekStart: '2026-05-15',
      weightKg: '82.50',
      waistCm: '85.0',
    })
    const out = await fetchDayDetail(db, USER, '2026-05-15')
    expect(out.measurement).not.toBeNull()
    expect(Number(out.measurement?.weightKg)).toBe(82.5)
  })

  it('returns photos with API URLs', async () => {
    const [p] = (await db.insert(bodyPhotos).values({
      userId: USER,
      takenAt: '2026-05-15',
      weekStart: '2026-05-11',
      pose: 'front',
      storageKey: `${PREFIX}p1`,
      widthPx: 100,
      heightPx: 100,
      byteSize: 1000,
    })) as unknown as [{ insertId: number }]
    const out = await fetchDayDetail(db, USER, '2026-05-15')
    expect(out.photos.length).toBe(1)
    expect(out.photos[0]?.id).toBe(p.insertId)
    expect(out.photos[0]?.fullUrl).toBe(`/api/photos/${p.insertId}`)
    expect(out.photos[0]?.thumbUrl).toBe(`/api/photos/${p.insertId}/thumb`)
    expect(out.photos[0]?.pose).toBe('front')
  })

  it('scopes everything by userId', async () => {
    await db.insert(sessions).values({
      userId: OTHER,
      startedAt: new Date('2026-05-15T10:00:00Z'),
      finishedAt: new Date('2026-05-15T11:00:00Z'),
    })
    const out = await fetchDayDetail(db, USER, '2026-05-15')
    expect(out.sessions).toEqual([])
  })
})
