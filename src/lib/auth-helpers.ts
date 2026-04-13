import { auth } from '@/lib/auth'

/**
 * Returns the currently signed-in user, or null.
 * For API routes prefer `requireSessionUser` which short-circuits to a Response.
 */
export async function getSessionUser() {
  const session = await auth()
  return session?.user ?? null
}

/**
 * Returns the session user, or a 401 Response.
 *
 * Usage:
 *   const user = await requireSessionUser()
 *   if (user instanceof Response) return user
 */
export async function requireSessionUser() {
  const user = await getSessionUser()
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'content-type': 'application/json' },
    })
  }
  return user
}

/**
 * Verifies that a row belongs to the current user.
 * Returns the row if OK, otherwise a 404 Response (never 403 — don't leak existence).
 *
 * Usage:
 *   const row = await requireOwnership(
 *     db.query.sessions.findFirst({ where: eq(sessions.id, id) }),
 *     user.id
 *   )
 *   if (row instanceof Response) return row
 */
export async function requireOwnership<T extends { userId: string }>(
  rowPromise: Promise<T | undefined>,
  userId: string
): Promise<T | Response> {
  const row = await rowPromise
  if (!row || row.userId !== userId) {
    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { 'content-type': 'application/json' },
    })
  }
  return row
}
