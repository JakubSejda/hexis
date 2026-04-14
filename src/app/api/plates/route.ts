import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { db } from '@/db/client'
import { plateInventories } from '@/db/schema'
import { getSessionUser } from '@/lib/auth-helpers'
import { DEFAULT_PLATE_INVENTORY } from '@/db/seed/plate-inventory'

const platesSchema = z.object({
  barKg: z.number().min(5).max(50),
  plates: z.array(
    z.object({
      weightKg: z.number().positive(),
      pairs: z.number().int().min(0).max(50),
    })
  ),
})

export async function GET() {
  const user = await getSessionUser()
  if (!user) return unauth()
  let row = await db.query.plateInventories.findFirst({
    where: eq(plateInventories.userId, user.id),
  })
  if (!row) {
    await db.insert(plateInventories).values({
      userId: user.id,
      barKg: DEFAULT_PLATE_INVENTORY.barKg,
      plates: [...DEFAULT_PLATE_INVENTORY.plates],
    })
    row = await db.query.plateInventories.findFirst({
      where: eq(plateInventories.userId, user.id),
    })
  }
  return Response.json({ barKg: Number(row!.barKg), plates: row!.plates })
}

export async function PUT(req: Request) {
  const user = await getSessionUser()
  if (!user) return unauth()
  const body = await req.json().catch(() => null)
  const parsed = platesSchema.safeParse(body)
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: 'Invalid body', details: parsed.error.format() }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    })
  }
  await db
    .insert(plateInventories)
    .values({
      userId: user.id,
      barKg: String(parsed.data.barKg),
      plates: parsed.data.plates,
    })
    .onDuplicateKeyUpdate({
      set: { barKg: String(parsed.data.barKg), plates: parsed.data.plates },
    })
  return Response.json({ barKg: parsed.data.barKg, plates: parsed.data.plates })
}

function unauth() {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), {
    status: 401,
    headers: { 'content-type': 'application/json' },
  })
}
