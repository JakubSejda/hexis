import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
dotenv.config({ path: '.env' })

import { drizzle } from 'drizzle-orm/mysql2'
import { eq } from 'drizzle-orm'
import mysql from 'mysql2/promise'
import * as readline from 'node:readline/promises'
import * as schema from './schema'
import { users, plans } from './schema'
import { hashPassword } from '../lib/password'
import { newUlid } from '../lib/ulid'
import { emailSchema, passwordSchema } from '../lib/validation'

async function prompt(rl: readline.Interface, q: string, hidden = false): Promise<string> {
  if (!hidden) return (await rl.question(q)).trim()

  // Hidden input (password) — node-readline doesn't natively hide input, trick:
  process.stdout.write(q)
  return new Promise((resolve) => {
    let input = ''
    const onData = (char: Buffer) => {
      const c = char.toString()
      if (c === '\n' || c === '\r' || c === '\u0004') {
        process.stdin.removeListener('data', onData)
        process.stdout.write('\n')
        resolve(input)
      } else if (c === '\u0003') {
        process.exit(130)
      } else {
        input += c
      }
    }
    process.stdin.on('data', onData)
  })
}

async function main() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL required')

  const connection = await mysql.createConnection(url)
  const db = drizzle(connection, { schema, mode: 'default' })

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })

  try {
    console.log('Hexis user bootstrap\n')

    const emailRaw = await prompt(rl, 'Email: ')
    const email = emailSchema.parse(emailRaw)

    const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1)
    if (existing) {
      console.log(`\nUser s emailem ${email} už existuje (id: ${existing.id}). Konec.`)
      return
    }

    const name = (await prompt(rl, 'Jméno (optional): ')) || null

    const password = await prompt(rl, 'Heslo (8+ znaků, ≥1 velké, ≥1 číslo): ', true)
    passwordSchema.parse(password)

    const passwordHash = await hashPassword(password)
    const userId = newUlid()

    await db.insert(users).values({
      id: userId,
      email,
      passwordHash,
      name,
      level: 1,
    })

    console.log(`\n✓ User vytvořen (id: ${userId})`)

    // Re-assign placeholder-seeded plans onto this user
    const PLACEHOLDER = '00000000000000000000000001'
    await db.update(plans).set({ userId }).where(eq(plans.userId, PLACEHOLDER))

    console.log(`✓ Plány (UA/UB/LA/LB) re-assigned z placeholder na ${userId}`)
  } finally {
    rl.close()
    await connection.end()
  }
}

main().catch((err) => {
  console.error('\nBootstrap failed:', err.message ?? err)
  process.exit(1)
})
