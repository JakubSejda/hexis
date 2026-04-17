import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { drizzle, type MySql2Database } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'
import { eq } from 'drizzle-orm'
import * as schema from '@/db/schema'
import { users, sessions, sessionSets, xpEvents } from '@/db/schema'
import { hashPassword } from '@/lib/password'
import { newUlid } from '@/lib/ulid'
import { checkAndFinishStaleSessions } from '@/lib/session-auto-finish'

const TWELVE_H_MS = 12 * 3600 * 1000

/** MySQL TIMESTAMP has second precision — strip ms to avoid mismatch */
function truncMs(d: Date): Date {
  return new Date(Math.floor(d.getTime() / 1000) * 1000)
}

describe('checkAndFinishStaleSessions', () => {
  const url = process.env.TEST_DATABASE_URL
  if (!url) throw new Error('TEST_DATABASE_URL required')

  let connection: mysql.Connection
  let db: MySql2Database<typeof schema>
  let userId: string

  beforeAll(async () => {
    connection = await mysql.createConnection(url)
    db = drizzle(connection, { schema, mode: 'default' })
  })

  afterAll(async () => {
    await connection.end()
  })

  beforeEach(async () => {
    await db.execute('SET FOREIGN_KEY_CHECKS = 0')
    for (const t of ['xp_events', 'session_sets', 'sessions', 'users']) {
      await db.execute(`TRUNCATE TABLE \`${t}\``)
    }
    await db.execute('SET FOREIGN_KEY_CHECKS = 1')
    userId = newUlid()
    await db.insert(users).values({
      id: userId,
      email: `af-${userId}@t.com`,
      passwordHash: await hashPassword('Abcd1234'),
      level: 1,
    })
  })

  it('session <12h stays open', async () => {
    const startedAt = truncMs(new Date(Date.now() - 2 * 3600 * 1000))
    await db.insert(sessions).values({ userId, startedAt, finishedAt: null })
    await checkAndFinishStaleSessions(userId, db)
    const rows = await db.select().from(sessions).where(eq(sessions.userId, userId))
    expect(rows[0]?.finishedAt).toBeNull()
  })

  it('session >12h with sets → finishedAt = MAX(session_sets.completedAt)', async () => {
    const startedAt = truncMs(new Date(Date.now() - TWELVE_H_MS - 3600 * 1000))
    const [{ insertId }] = (await db.insert(sessions).values({ userId, startedAt })) as unknown as [
      { insertId: number },
    ]
    const sessionId = insertId
    const lastSetTime = truncMs(new Date(startedAt.getTime() + 1800 * 1000)) // 30 min in
    await db.insert(sessionSets).values({
      sessionId,
      exerciseId: 999,
      setIndex: 0,
      weightKg: '60.00',
      reps: 8,
      completedAt: lastSetTime,
    })
    await checkAndFinishStaleSessions(userId, db)
    const [row] = await db.select().from(sessions).where(eq(sessions.id, sessionId))
    expect(row?.finishedAt).toEqual(lastSetTime)
  })

  it('session >12h with no sets → finishedAt = startedAt + 1h', async () => {
    const startedAt = truncMs(new Date(Date.now() - TWELVE_H_MS - 3600 * 1000))
    const [{ insertId }] = (await db.insert(sessions).values({ userId, startedAt })) as unknown as [
      { insertId: number },
    ]
    await checkAndFinishStaleSessions(userId, db)
    const [row] = await db.select().from(sessions).where(eq(sessions.id, insertId))
    expect(row?.finishedAt).toEqual(new Date(startedAt.getTime() + 3600 * 1000))
  })

  it('awards session_complete XP on auto-finish', async () => {
    const startedAt = truncMs(new Date(Date.now() - TWELVE_H_MS - 3600 * 1000))
    await db.insert(sessions).values({ userId, startedAt })
    await checkAndFinishStaleSessions(userId, db)
    const events = await db.select().from(xpEvents).where(eq(xpEvents.userId, userId))
    const complete = events.find((e) => e.eventType === 'session_complete')
    expect(complete?.xpDelta).toBe(100)
  })

  it('idempotent — second call does nothing', async () => {
    const startedAt = truncMs(new Date(Date.now() - TWELVE_H_MS - 3600 * 1000))
    await db.insert(sessions).values({ userId, startedAt })
    await checkAndFinishStaleSessions(userId, db)
    await checkAndFinishStaleSessions(userId, db)
    const events = await db.select().from(xpEvents).where(eq(xpEvents.userId, userId))
    expect(events.filter((e) => e.eventType === 'session_complete').length).toBe(1)
  })
})
