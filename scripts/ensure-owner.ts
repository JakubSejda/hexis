/**
 * Creates the owner's account on a fresh deployment, where there is no
 * signup and no shell to run the interactive bootstrap.
 *
 * Reads OWNER_EMAIL and OWNER_PASSWORD (and optional OWNER_NAME) from the
 * environment. Does nothing when they are unset or the account exists, so it
 * is safe on every build. Never prints the password.
 */
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
dotenv.config({ path: '.env' })

import { drizzle } from 'drizzle-orm/mysql2'
import { eq } from 'drizzle-orm'
import mysql from 'mysql2/promise'
import * as schema from '../src/db/schema'
import { users } from '../src/db/schema'
import { hashPassword } from '../src/lib/password'
import { newUlid } from '../src/lib/ulid'
import { emailSchema, passwordSchema } from '../src/lib/validation'
import { seedPlans } from '../src/db/seed/plans'
import { seedPlateInventory } from '../src/db/seed/plate-inventory'

async function main() {
  const rawEmail = process.env.OWNER_EMAIL
  const password = process.env.OWNER_PASSWORD
  if (!rawEmail || !password) {
    console.log('ensure-owner: OWNER_EMAIL / OWNER_PASSWORD not set — skipping.')
    return
  }
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL required')

  const email = emailSchema.parse(rawEmail.trim().toLowerCase())
  passwordSchema.parse(password)

  const connection = await mysql.createConnection(url)
  const db = drizzle(connection, { schema, mode: 'default' })
  try {
    const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1)
    if (existing) {
      console.log(`ensure-owner: ${email} already exists.`)
      return
    }
    const id = newUlid()
    await db.insert(users).values({
      id,
      email,
      passwordHash: await hashPassword(password),
      name: process.env.OWNER_NAME?.trim() || null,
      level: 1,
    })
    await seedPlans(db, id)
    await seedPlateInventory(db, id)
    console.log(`ensure-owner: created ${email}.`)
  } finally {
    await connection.end()
  }
}

main().catch((err) => {
  console.error('ensure-owner failed:', err instanceof Error ? err.message : err)
  process.exit(1)
})
