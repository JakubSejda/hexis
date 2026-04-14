import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { drizzle, type MySql2Database } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'
import { eq } from 'drizzle-orm'
import * as schema from '@/db/schema'
import { users, xpEvents } from '@/db/schema'
import { hashPassword } from '@/lib/password'
import { newUlid } from '@/lib/ulid'
import { awardXp, getTotalXp, reverseXp } from '@/lib/xp'
import { xpToLevel } from '@/lib/xp-events'

describe('xp level curve', () => {
  it('level 1 at 0 xp', () => {
    expect(xpToLevel(0)).toBe(1)
  })

  it('level 2 at 100 xp', () => {
    expect(xpToLevel(100)).toBe(2)
  })

  it('level 3 at 400 xp', () => {
    expect(xpToLevel(400)).toBe(3)
  })

  it('level 5 at 1600 xp', () => {
    expect(xpToLevel(1600)).toBe(5)
  })
})

describe('awardXp + reverseXp (DB integration)', () => {
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
    await db.execute('TRUNCATE TABLE xp_events')
    await db.execute('TRUNCATE TABLE users')
    await db.execute('SET FOREIGN_KEY_CHECKS = 1')
    userId = newUlid()
    await db.insert(users).values({
      id: userId,
      email: `xp-${userId}@t.com`,
      passwordHash: await hashPassword('Abcd1234'),
      level: 1,
    })
  })

  it('awards set_logged +5 and returns new total', async () => {
    const r = await awardXp({ event: 'set_logged', db, userId })
    expect(r.xpDelta).toBe(5)
    expect(r.newTotalXp).toBe(5)
    expect(r.levelUp).toBe(false)
  })

  it('levelUp=true when crossing threshold', async () => {
    // seed 95 XP
    await db.insert(xpEvents).values({ userId, eventType: 'session_complete', xpDelta: 95 })
    const r = await awardXp({ event: 'set_logged', db, userId })
    expect(r.newTotalXp).toBe(100)
    expect(r.levelUp).toBe(true) // level 1 → 2
  })

  it('reverseXp appends negative event', async () => {
    await awardXp({ event: 'set_logged', db, userId })
    const r = await reverseXp({ event: 'set_logged', db, userId, sessionId: null })
    expect(r.xpDelta).toBe(-5)
    expect(r.newTotalXp).toBe(0)
  })

  it('getTotalXp sums across all events', async () => {
    await awardXp({ event: 'set_logged', db, userId })
    await awardXp({ event: 'set_logged', db, userId })
    await awardXp({ event: 'session_complete', db, userId })
    expect(await getTotalXp(db, userId)).toBe(110)
  })
})
