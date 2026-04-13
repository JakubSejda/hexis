import { requireSessionUser } from '@/lib/auth-helpers'

export async function GET() {
  const user = await requireSessionUser()
  if (user instanceof Response) return user

  return Response.json({
    id: user.id,
    email: user.email,
    name: user.name,
    level: user.level,
  })
}
