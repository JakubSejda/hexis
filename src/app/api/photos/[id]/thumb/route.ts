import { readFile } from 'node:fs/promises'
import { db } from '@/db/client'
import { requireSessionUser } from '@/lib/auth-helpers'
import { getPhotoById } from '@/lib/queries/photos'
import { thumbPath } from '@/lib/photo-storage'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireSessionUser()
  if (user instanceof Response) return user
  const { id } = await params

  const photo = await getPhotoById(db, user.id, Number(id))
  if (!photo) {
    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 })
  }

  const buffer = await readFile(thumbPath(photo.storageKey))
  return new Response(buffer, {
    headers: {
      'Content-Type': 'image/jpeg',
      'Cache-Control': 'private, max-age=86400',
      'Content-Disposition': 'inline',
    },
  })
}
