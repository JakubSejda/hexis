import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
dotenv.config({ path: '.env' })

import { drizzle } from 'drizzle-orm/mysql2'
import { eq } from 'drizzle-orm'
import mysql from 'mysql2/promise'
import * as schema from '../src/db/schema'
import { users, plans, measurements, nutritionDays } from '../src/db/schema'
import { hashPassword } from '../src/lib/password'
import { newUlid } from '../src/lib/ulid'
import { seedPlans } from '../src/db/seed/plans'
import { seedPlateInventory } from '../src/db/seed/plate-inventory'

async function main() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL required')

  const connection = await mysql.createConnection(url)
  const db = drizzle(connection, { schema, mode: 'default' })

  const email = 'demo@hexis.local'
  const password = 'Demo1234'

  const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1)
  let userId: string
  if (existing) {
    userId = existing.id
    console.log(`User ${email} already exists (id: ${userId}) — reusing.`)
  } else {
    userId = newUlid()
    const passwordHash = await hashPassword(password)
    await db.insert(users).values({
      id: userId,
      email,
      name: 'Demo User',
      passwordHash,
      level: 1,
      trackedMacros: ['kcal', 'protein', 'carbs', 'fat'],
    })
    await seedPlans(db, userId)
    await seedPlateInventory(db, userId)
    console.log(`Created user ${email} (id: ${userId})`)
  }

  // Seed sample measurements for last 8 weeks so the /progress/body page is populated
  const now = new Date()
  const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  const dayOfWeek = monday.getUTCDay()
  monday.setUTCDate(monday.getUTCDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))

  const sampleWeights = [72.8, 72.4, 72.1, 71.7, 71.3, 70.9, 70.5, 70.2]
  const sampleWaists = [84.5, 84.2, 83.8, 83.5, 83.1, 82.7, 82.3, 82.0]
  const sampleChests = [98.0, 98.2, 98.3, 98.5, 98.6, 98.7, 98.8, 99.0]
  const sampleThighs = [55.0, 55.2, 55.4, 55.6, 55.8, 56.0, 56.1, 56.3]
  const sampleBiceps = [35.5, 35.7, 35.9, 36.0, 36.2, 36.3, 36.5, 36.6]

  for (let i = 7; i >= 0; i--) {
    const d = new Date(monday)
    d.setUTCDate(d.getUTCDate() - i * 7)
    const weekStart = d.toISOString().slice(0, 10)
    const idx = 7 - i
    await db
      .insert(measurements)
      .values({
        userId,
        weekStart,
        weightKg: String(sampleWeights[idx]!),
        waistCm: String(sampleWaists[idx]!),
        chestCm: String(sampleChests[idx]!),
        thighCm: String(sampleThighs[idx]!),
        bicepsCm: String(sampleBiceps[idx]!),
        targetKcal: 2200,
        targetProteinG: 160,
        targetCarbsG: 220,
        targetFatG: 70,
      })
      .onDuplicateKeyUpdate({
        set: {
          weightKg: String(sampleWeights[idx]!),
          waistCm: String(sampleWaists[idx]!),
          chestCm: String(sampleChests[idx]!),
          thighCm: String(sampleThighs[idx]!),
          bicepsCm: String(sampleBiceps[idx]!),
          targetKcal: 2200,
          targetProteinG: 160,
          targetCarbsG: 220,
          targetFatG: 70,
        },
      })
  }

  // Seed last 14 days of nutrition so calendar + streak have content
  const sampleKcal = [
    2100, 2250, 2180, 2300, 2150, 2400, 2050, 2200, 2180, 2150, 2100, 2250, 2180, 2120,
  ]
  const sampleProtein = [155, 162, 148, 170, 145, 175, 140, 160, 165, 158, 150, 163, 155, 158]
  const sampleCarbs = [210, 240, 200, 250, 205, 260, 195, 215, 210, 205, 200, 220, 215, 200]
  const sampleFat = [68, 72, 65, 75, 62, 80, 60, 68, 70, 67, 63, 72, 68, 65]

  for (let i = 13; i >= 0; i--) {
    const d = new Date(now)
    d.setUTCDate(d.getUTCDate() - i)
    const date = d.toISOString().slice(0, 10)
    const idx = 13 - i
    await db
      .insert(nutritionDays)
      .values({
        userId,
        date,
        kcalActual: sampleKcal[idx]!,
        proteinG: sampleProtein[idx]!,
        carbsG: sampleCarbs[idx]!,
        fatG: sampleFat[idx]!,
      })
      .onDuplicateKeyUpdate({
        set: {
          kcalActual: sampleKcal[idx]!,
          proteinG: sampleProtein[idx]!,
          carbsG: sampleCarbs[idx]!,
          fatG: sampleFat[idx]!,
        },
      })
  }

  console.log('Seeded 8 weeks of measurements + 14 days of nutrition.')
  console.log(`\nLogin: ${email} / ${password}`)

  await connection.end()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
