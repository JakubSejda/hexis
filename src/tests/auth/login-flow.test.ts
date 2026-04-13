import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { drizzle, type MySql2Database } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'
import { eq } from 'drizzle-orm'
import * as schema from '@/db/schema'
import { users } from '@/db/schema'
import { hashPassword, verifyPassword } from '@/lib/password'
import { newUlid } from '@/lib/ulid'

// Helper: reset test DB tables
async function truncateAll(db: MySql2Database<typeof schema>) {
  await db.execute('SET FOREIGN_KEY_CHECKS = 0')
  for (const table of [
    'xp_events',
    'body_photos',
    'nutrition_days',
    'measurements',
    'session_sets',
    'sessions',
    'plan_exercises',
    'plans',
    'exercise_muscle_groups',
    'exercises',
    'muscle_groups',
    'accounts',
    'users',
  ]) {
    await db.execute(`TRUNCATE TABLE \`${table}\``)
  }
  await db.execute('SET FOREIGN_KEY_CHECKS = 1')
}

describe('login flow (DB integration)', () => {
  const url = process.env.TEST_DATABASE_URL
  if (!url) throw new Error('TEST_DATABASE_URL required for integration tests')

  let connection: mysql.Connection
  let db: MySql2Database<typeof schema>

  beforeAll(async () => {
    connection = await mysql.createConnection(url)
    db = drizzle(connection, { schema, mode: 'default' })
  })

  afterAll(async () => {
    await connection.end()
  })

  it('bootstrapped user can be found by email and password verifies', async () => {
    await truncateAll(db)

    const email = 'integration@test.com'
    const plainPassword = 'Integr4tion'
    const passwordHash = await hashPassword(plainPassword)
    const userId = newUlid()

    await db.insert(users).values({
      id: userId,
      email,
      passwordHash,
      name: 'Integration Test',
      level: 1,
    })

    const [found] = await db.select().from(users).where(eq(users.email, email)).limit(1)
    expect(found).toBeDefined()
    expect(found!.email).toBe(email)

    expect(await verifyPassword(found!.passwordHash!, plainPassword)).toBe(true)
    expect(await verifyPassword(found!.passwordHash!, 'WrongPass1')).toBe(false)
  })

  it('duplicate email insert fails (unique constraint)', async () => {
    await truncateAll(db)

    const email = 'dup@test.com'
    await db.insert(users).values({
      id: newUlid(),
      email,
      passwordHash: await hashPassword('Abcd1234'),
      level: 1,
    })

    await expect(
      db.insert(users).values({
        id: newUlid(),
        email,
        passwordHash: await hashPassword('Efgh5678'),
        level: 1,
      })
    ).rejects.toThrow()
  })
})
