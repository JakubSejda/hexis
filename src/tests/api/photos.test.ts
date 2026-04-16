import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { db } from '@/db/client'
import { users, bodyPhotos } from '@/db/schema'
import {
  insertPhoto,
  listPhotos,
  getPhotoById,
  deletePhoto,
  getDistinctDates,
} from '@/lib/queries/photos'
import { eq } from 'drizzle-orm'

const TEST_USER_ID = 'photo_test_000000000001'

describe('photo queries', () => {
  let photoId: number

  beforeAll(async () => {
    await db.insert(users).values({
      id: TEST_USER_ID,
      email: 'photo-test@hexis.local',
      name: 'Photo Test',
      passwordHash: 'x',
    })
  })

  afterAll(async () => {
    await db.delete(bodyPhotos).where(eq(bodyPhotos.userId, TEST_USER_ID))
    await db.delete(users).where(eq(users.id, TEST_USER_ID))
  })

  it('inserts a photo', async () => {
    const result = await insertPhoto(db, {
      userId: TEST_USER_ID,
      takenAt: '2026-04-16',
      weekStart: '2026-04-14',
      pose: 'front',
      storageKey: `${TEST_USER_ID}/test-uuid-1`,
      widthPx: 1200,
      heightPx: 1600,
      byteSize: 50000,
    })
    expect(result.id).toBeGreaterThan(0)
    photoId = result.id
  })

  it('lists photos for user with pagination', async () => {
    const result = await listPhotos(db, TEST_USER_ID, { limit: 10 })
    expect(result.items.length).toBeGreaterThanOrEqual(1)
    expect(result.items[0]!.pose).toBe('front')
  })

  it('filters photos by pose', async () => {
    const result = await listPhotos(db, TEST_USER_ID, { limit: 10, pose: 'back' })
    expect(result.items.length).toBe(0)
  })

  it('gets photo by id with ownership check', async () => {
    const photo = await getPhotoById(db, TEST_USER_ID, photoId)
    expect(photo).not.toBeNull()
    expect(photo!.storageKey).toContain('test-uuid-1')
  })

  it('returns null for wrong user', async () => {
    const photo = await getPhotoById(db, 'wrong_user_0000000000001', photoId)
    expect(photo).toBeNull()
  })

  it('gets distinct dates', async () => {
    const dates = await getDistinctDates(db, TEST_USER_ID)
    expect(dates).toContain('2026-04-16')
  })

  it('deletes photo', async () => {
    const deleted = await deletePhoto(db, TEST_USER_ID, photoId)
    expect(deleted).toBe(true)
    const after = await getPhotoById(db, TEST_USER_ID, photoId)
    expect(after).toBeNull()
  })
})
