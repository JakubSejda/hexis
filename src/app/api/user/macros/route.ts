import { z } from 'zod'
import { db } from '@/db/client'
import { getSessionUser } from '@/lib/auth-helpers'
import { ALL_MACROS, getMacros, setMacros } from '@/lib/queries/user-prefs'

export async function GET() {
  const user = await getSessionUser()
  if (!user) return unauth()
  const macros = await getMacros(db, user.id)
  return Response.json({ macros })
}

const putSchema = z.object({
  macros: z.array(z.enum(ALL_MACROS as unknown as readonly [string, ...string[]])),
})

export async function PUT(req: Request) {
  const user = await getSessionUser()
  if (!user) return unauth()
  const body = await req.json().catch(() => ({}))
  const parsed = putSchema.safeParse(body)
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: 'Invalid body', details: parsed.error }), {
      status: 400,
    })
  }
  const macros = await setMacros(db, user.id, parsed.data.macros)
  return Response.json({ macros })
}

function unauth() {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
}
