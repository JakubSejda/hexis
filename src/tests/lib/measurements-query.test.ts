import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { like } from 'drizzle-orm'
import { db } from '@/db/client'
import { measurements, users } from '@/db/schema'
import { fetchLatestMeasurement, fetchFirstMeasurement } from '@/lib/queries/measurements'

const PREFIX = 'meaq_'
const USER = `${PREFIX}user00000000000001`
const OTHER = `${PREFIX}user00000000000002`

async function cleanup() {
  await db.delete(measurements).where(like(measurements.userId, `${PREFIX}%`))
  await db.delete(users).where(like(users.id, `${PREFIX}%`))
}

beforeAll(cleanup)
afterAll(cleanup)

beforeEach(async () => {
  await cleanup()
  await db.insert(users).values([
    { id: USER, email: `${PREFIX}m@hexis.local` },
    { id: OTHER, email: `${PREFIX}o@hexis.local` },
  ])
})

describe('fetchLatestMeasurement / fetchFirstMeasurement', () => {
  it('returns null when user has no measurements', async () => {
    expect(await fetchLatestMeasurement(db, USER)).toBeNull()
    expect(await fetchFirstMeasurement(db, USER)).toBeNull()
  })

  it('returns the measurement with the largest weekStart for latest', async () => {
    await db.insert(measurements).values([
      { userId: USER, weekStart: '2024-01-01', weightKg: '90.00' },
      { userId: USER, weekStart: '2024-06-03', weightKg: '85.00' },
      { userId: USER, weekStart: '2024-03-04', weightKg: '88.00' },
    ])
    const latest = await fetchLatestMeasurement(db, USER)
    expect(latest?.weekStart).toBe('2024-06-03')
    expect(Number(latest?.weightKg)).toBe(85)
  })

  it('returns the measurement with the smallest weekStart for first', async () => {
    await db.insert(measurements).values([
      { userId: USER, weekStart: '2024-01-01', weightKg: '90.00' },
      { userId: USER, weekStart: '2024-06-03', weightKg: '85.00' },
      { userId: USER, weekStart: '2024-03-04', weightKg: '88.00' },
    ])
    const first = await fetchFirstMeasurement(db, USER)
    expect(first?.weekStart).toBe('2024-01-01')
    expect(Number(first?.weightKg)).toBe(90)
  })

  it('scopes by userId', async () => {
    await db.insert(measurements).values([
      { userId: USER, weekStart: '2024-01-01', weightKg: '90.00' },
      { userId: OTHER, weekStart: '2024-12-01', weightKg: '70.00' },
    ])
    const latest = await fetchLatestMeasurement(db, USER)
    expect(latest?.weekStart).toBe('2024-01-01')
  })
})
