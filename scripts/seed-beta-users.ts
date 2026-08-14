/**
 * Seed friends-and-family beta accounts.
 *
 * Usage:
 *   npx tsx scripts/seed-beta-users.ts alice@example.com bob@example.com
 *   npx tsx scripts/seed-beta-users.ts --file emails.txt   (one email per line)
 *
 * For each email: creates a user with a generated 12-char password
 * (argon2-hashed), seeds plans + plate inventory, and leaves
 * onboarded_at NULL so the account gets the first-run onboarding wizard.
 * Passwords are printed to stdout ONLY — hand them out personally.
 * Existing emails are skipped with a warning (idempotent).
 */
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
dotenv.config({ path: '.env' })

import { randomBytes } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { drizzle } from 'drizzle-orm/mysql2'
import { eq } from 'drizzle-orm'
import mysql from 'mysql2/promise'
import * as schema from '../src/db/schema'
import { users } from '../src/db/schema'
import { hashPassword } from '../src/lib/password'
import { newUlid } from '../src/lib/ulid'
import { seedPlans } from '../src/db/seed/plans'
import { seedPlateInventory } from '../src/db/seed/plate-inventory'

// Unambiguous alphabet (no 0/O, 1/l/I) — passwords get typed from a phone.
const ALPHABET = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789'

function generatePassword(length = 12): string {
  const bytes = randomBytes(length)
  let out = ''
  for (let i = 0; i < length; i++) out += ALPHABET[bytes[i]! % ALPHABET.length]
  return out
}

function parseEmails(argv: string[]): string[] {
  const fileIdx = argv.indexOf('--file')
  const raw =
    fileIdx !== -1
      ? readFileSync(argv[fileIdx + 1]!, 'utf8').split('\n')
      : argv.filter((a) => !a.startsWith('--'))
  const emails = raw.map((e) => e.trim().toLowerCase()).filter(Boolean)
  const invalid = emails.filter((e) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))
  if (invalid.length > 0) {
    throw new Error(`Invalid emails: ${invalid.join(', ')}`)
  }
  return Array.from(new Set(emails))
}

async function main() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL required')

  const emails = parseEmails(process.argv.slice(2))
  if (emails.length === 0) {
    console.error('No emails given. Usage: npx tsx scripts/seed-beta-users.ts a@b.cz [c@d.cz ...]')
    process.exit(1)
  }

  const connection = await mysql.createConnection(url)
  const db = drizzle(connection, { schema, mode: 'default' })

  const created: Array<{ email: string; password: string }> = []
  for (const email of emails) {
    const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1)
    if (existing) {
      console.warn(`~ ${email} already exists — skipping.`)
      continue
    }
    const password = generatePassword()
    const userId = newUlid()
    await db.insert(users).values({
      id: userId,
      email,
      passwordHash: await hashPassword(password),
      level: 1,
      trackedMacros: ['kcal', 'protein', 'carbs', 'fat'],
      // onboardedAt stays NULL → first login gets the onboarding wizard.
    })
    await seedPlans(db, userId)
    await seedPlateInventory(db, userId)
    created.push({ email, password })
    console.log(`+ ${email} created`)
  }

  if (created.length > 0) {
    console.log('\nCredentials (hand out personally, not stored anywhere):\n')
    for (const { email, password } of created) {
      console.log(`  ${email}  ${password}`)
    }
  }
  console.log(`\nDone: ${created.length} created, ${emails.length - created.length} skipped.`)

  await connection.end()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
