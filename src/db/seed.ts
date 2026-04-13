import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
dotenv.config({ path: '.env' })

import { drizzle } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'
import * as schema from './schema'
import { seedMuscleGroups } from './seed/muscle-groups'
import { seedExercises } from './seed/exercises'
import { seedPlans } from './seed/plans'

async function main() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL required')

  const connection = await mysql.createConnection(url)
  const db = drizzle(connection, { schema, mode: 'default' })

  // Idempotence: pokud je muscle_groups už naplněna, skip
  const [existing] = await db.select().from(schema.muscleGroups).limit(1)
  if (existing) {
    console.log('Seed already applied — muscle_groups table non-empty. Skipping.')
    console.log('  To re-seed: truncate tables manually, then re-run.')
    await connection.end()
    return
  }

  console.log('Seeding muscle_groups...')
  await seedMuscleGroups(db)

  console.log('Seeding exercises + muscle group mapping...')
  await seedExercises(db)

  console.log('Seeding plans (UA/UB/LA/LB)...')
  await seedPlans(db)

  console.log('Seed complete.')
  await connection.end()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
