import { and, eq } from 'drizzle-orm'
import { db } from '@/db/client'
import { measurements } from '@/db/schema'
import { getSessionUser } from '@/lib/auth-helpers'
import { deleteById } from '@/lib/queries/measurements'
import { reverseXp } from '@/lib/xp'

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser()
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }
  const { id: idStr } = await params
  const id = Number(idStr)
  if (!Number.isInteger(id) || id <= 0) {
    return new Response(JSON.stringify({ error: 'Invalid id' }), { status: 400 })
  }
  const row = await db.query.measurements.findFirst({
    where: and(eq(measurements.id, id), eq(measurements.userId, user.id)),
    columns: { id: true },
  })
  if (!row) {
    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 })
  }
  const { deleted } = await deleteById(db, user.id, id)
  if (!deleted) {
    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 })
  }
  await reverseXp({
    event: 'measurement_added',
    db,
    userId: user.id,
    sessionId: null,
    meta: { deletedMeasurementId: id },
  })
  return new Response(null, { status: 204 })
}
