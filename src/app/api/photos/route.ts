import { db } from '@/db/client'
import { requireSessionUser } from '@/lib/auth-helpers'
import { processPhoto } from '@/lib/photo-processing'
import { insertPhoto, listPhotos } from '@/lib/queries/photos'
import { toWeekStart } from '@/lib/week'
import { awardXp } from '@/lib/xp'

const MAX_FILE_SIZE = 10 * 1024 * 1024
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const POSES = ['front', 'side', 'back', 'other'] as const

export async function GET(req: Request) {
  const user = await requireSessionUser()
  if (user instanceof Response) return user

  const url = new URL(req.url)
  const limit = Math.min(Number(url.searchParams.get('limit') ?? 20), 100)
  const cursor = url.searchParams.get('cursor') ? Number(url.searchParams.get('cursor')) : undefined
  const pose = url.searchParams.get('pose') as (typeof POSES)[number] | undefined
  const validPose = pose && POSES.includes(pose) ? pose : undefined

  const result = await listPhotos(db, user.id, { limit, cursor, pose: validPose })

  return Response.json({
    items: result.items.map((p) => ({
      id: p.id,
      takenAt: p.takenAt,
      weekStart: p.weekStart,
      pose: p.pose,
      thumbUrl: `/api/photos/${p.id}/thumb`,
      fullUrl: `/api/photos/${p.id}`,
      widthPx: p.widthPx,
      heightPx: p.heightPx,
      note: p.note,
      createdAt: p.createdAt,
    })),
    nextCursor: result.nextCursor,
  })
}

export async function POST(req: Request) {
  const user = await requireSessionUser()
  if (user instanceof Response) return user

  const formData = await req.formData()
  const file = formData.get('file')
  const pose = formData.get('pose') as string
  const takenAt = formData.get('takenAt') as string

  if (!pose || !POSES.includes(pose as (typeof POSES)[number])) {
    return new Response(JSON.stringify({ error: 'Invalid pose' }), { status: 400 })
  }
  if (!takenAt || !/^\d{4}-\d{2}-\d{2}$/.test(takenAt)) {
    return new Response(JSON.stringify({ error: 'Invalid takenAt' }), { status: 400 })
  }
  if (!file || !(file instanceof File)) {
    return new Response(JSON.stringify({ error: 'No file provided' }), { status: 400 })
  }
  if (file.size > MAX_FILE_SIZE) {
    return new Response(JSON.stringify({ error: 'File too large (max 10 MB)' }), { status: 400 })
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return new Response(JSON.stringify({ error: 'Invalid file type' }), { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const processed = await processPhoto(buffer, user.id)

  const weekStart = toWeekStart(new Date(takenAt + 'T00:00:00Z'))
  const { id } = await insertPhoto(db, {
    userId: user.id,
    takenAt,
    weekStart,
    pose: pose as 'front' | 'side' | 'back' | 'other',
    storageKey: processed.storageKey,
    widthPx: processed.widthPx,
    heightPx: processed.heightPx,
    byteSize: processed.byteSize,
  })

  const xp = await awardXp({
    event: 'photo_uploaded',
    db,
    userId: user.id,
    meta: { photoId: id },
  })

  return Response.json(
    {
      id,
      thumbUrl: `/api/photos/${id}/thumb`,
      fullUrl: `/api/photos/${id}`,
      xpDelta: xp.xpDelta,
      levelUp: xp.levelUp,
      tierUp: xp.tierUp,
      levelAfter: xp.levelAfter,
      tierAfter: xp.tierAfter,
    },
    { status: 201 }
  )
}
