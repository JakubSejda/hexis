import { and, desc, eq, lt, sql } from 'drizzle-orm'
import type { MySql2Database } from 'drizzle-orm/mysql2'
import * as schema from '@/db/schema'
import { bodyPhotos } from '@/db/schema'

type DB = MySql2Database<typeof schema>

type InsertInput = {
  userId: string
  takenAt: string
  weekStart: string
  pose: 'front' | 'side' | 'back' | 'other'
  storageKey: string
  widthPx: number
  heightPx: number
  byteSize: number
}

export async function insertPhoto(db: DB, input: InsertInput): Promise<{ id: number }> {
  const [result] = await db.insert(bodyPhotos).values(input)
  return { id: result.insertId }
}

type ListOptions = {
  limit: number
  cursor?: number
  pose?: 'front' | 'side' | 'back' | 'other'
}

type PhotoItem = {
  id: number
  takenAt: string
  weekStart: string | null
  pose: 'front' | 'side' | 'back' | 'other'
  storageKey: string
  widthPx: number | null
  heightPx: number | null
  note: string | null
  createdAt: Date
}

export async function listPhotos(
  db: DB,
  userId: string,
  opts: ListOptions
): Promise<{ items: PhotoItem[]; nextCursor: number | null }> {
  const conditions = [eq(bodyPhotos.userId, userId)]
  if (opts.cursor) conditions.push(lt(bodyPhotos.id, opts.cursor))
  if (opts.pose) conditions.push(eq(bodyPhotos.pose, opts.pose))

  const rows = await db
    .select()
    .from(bodyPhotos)
    .where(and(...conditions))
    .orderBy(desc(bodyPhotos.takenAt), desc(bodyPhotos.id))
    .limit(opts.limit + 1)

  const hasMore = rows.length > opts.limit
  const items = hasMore ? rows.slice(0, opts.limit) : rows
  const nextCursor = hasMore ? items[items.length - 1]!.id : null

  return { items, nextCursor }
}

export async function getPhotoById(db: DB, userId: string, id: number): Promise<PhotoItem | null> {
  const row = await db.query.bodyPhotos.findFirst({
    where: and(eq(bodyPhotos.id, id), eq(bodyPhotos.userId, userId)),
  })
  return row ?? null
}

export async function deletePhoto(db: DB, userId: string, id: number): Promise<boolean> {
  const result = (await db
    .delete(bodyPhotos)
    .where(and(eq(bodyPhotos.id, id), eq(bodyPhotos.userId, userId)))) as unknown as [
    { affectedRows: number },
  ]
  return result[0].affectedRows > 0
}

export async function getDistinctDates(db: DB, userId: string): Promise<string[]> {
  const [rows] = await db.execute(sql`
    SELECT DISTINCT taken_at AS date
    FROM body_photos
    WHERE user_id = ${userId}
    ORDER BY taken_at DESC
  `)
  return (rows as unknown as { date: string }[]).map((r) => String(r.date))
}
