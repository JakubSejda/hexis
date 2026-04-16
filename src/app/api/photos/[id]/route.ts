import { readFile } from 'node:fs/promises'
import { db } from '@/db/client'
import { requireSessionUser } from '@/lib/auth-helpers'
import { getPhotoById, deletePhoto } from '@/lib/queries/photos'
import { photoPath, deletePhotoFiles } from '@/lib/photo-storage'
import { reverseXp } from '@/lib/xp'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireSessionUser()
  if (user instanceof Response) return user
  const { id } = await params

  const photo = await getPhotoById(db, user.id, Number(id))
  if (!photo) {
    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 })
  }

  const buffer = await readFile(photoPath(photo.storageKey))
  return new Response(buffer, {
    headers: {
      'Content-Type': 'image/jpeg',
      'Cache-Control': 'private, max-age=86400',
      'Content-Disposition': 'inline',
    },
  })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireSessionUser()
  if (user instanceof Response) return user
  const { id } = await params

  const photo = await getPhotoById(db, user.id, Number(id))
  if (!photo) {
    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 })
  }

  await deletePhotoFiles(photo.storageKey)
  await deletePhoto(db, user.id, Number(id))

  const xp = await reverseXp({
    event: 'photo_uploaded',
    db,
    userId: user.id,
    sessionId: null,
    meta: { photoId: Number(id) },
  })

  return Response.json({
    deleted: true,
    xpDelta: xp.xpDelta,
    levelAfter: xp.levelAfter,
    tierAfter: xp.tierAfter,
  })
}
