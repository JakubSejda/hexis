# M5 — Body Photos Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upload, process, and view body progress photos with grid, timeline, and before/after comparison views.

**Architecture:** Client converts HEIC→JPEG, uploads via multipart FormData. Server processes with sharp (resize+EXIF strip+thumbnail), stores to `./uploads/{userId}/`. Auth-gated serving via API routes. Three view modes on `/progress/photos`.

**Tech Stack:** sharp 0.33, heic2any 0.0.4, existing Next.js 16/Drizzle/Radix stack.

**Test runner:** `npx vitest run --no-file-parallelism`

**Branch:** `m5-body-photos` (from `main`)

---

### Task 1: Create branch + install deps

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Create branch**

```bash
git checkout main
git checkout -b m5-body-photos
```

- [ ] **Step 2: Install dependencies**

```bash
npm install sharp heic2any
```

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore(m5): install sharp, heic2any"
```

---

### Task 2: Photo storage helpers + tests

**Files:**
- Create: `src/lib/photo-storage.ts`
- Create: `src/tests/lib/photo-storage.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// src/tests/lib/photo-storage.test.ts
import { describe, it, expect, afterAll } from 'vitest'
import { photoPath, thumbPath, ensureUserDir, deletePhotoFiles } from '@/lib/photo-storage'
import { existsSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'

const UPLOADS_ROOT = join(process.cwd(), 'uploads')
const TEST_USER = 'test_photo_user_000001'

describe('photo-storage', () => {
  afterAll(() => {
    const dir = join(UPLOADS_ROOT, TEST_USER)
    if (existsSync(dir)) rmSync(dir, { recursive: true })
  })

  it('generates correct full photo path', () => {
    const p = photoPath('user123/abc-def')
    expect(p).toBe(join(UPLOADS_ROOT, 'user123', 'abc-def.jpg'))
  })

  it('generates correct thumb path', () => {
    const p = thumbPath('user123/abc-def')
    expect(p).toBe(join(UPLOADS_ROOT, 'user123', 'abc-def_thumb.jpg'))
  })

  it('creates user directory if not exists', async () => {
    await ensureUserDir(TEST_USER)
    expect(existsSync(join(UPLOADS_ROOT, TEST_USER))).toBe(true)
  })

  it('deletes both full and thumb files', async () => {
    const storageKey = `${TEST_USER}/delete-test`
    const full = photoPath(storageKey)
    const thumb = thumbPath(storageKey)
    writeFileSync(full, 'fake')
    writeFileSync(thumb, 'fake')
    expect(existsSync(full)).toBe(true)

    await deletePhotoFiles(storageKey)
    expect(existsSync(full)).toBe(false)
    expect(existsSync(thumb)).toBe(false)
  })

  it('does not throw if files already deleted', async () => {
    await expect(deletePhotoFiles(`${TEST_USER}/nonexistent`)).resolves.not.toThrow()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/tests/lib/photo-storage.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement photo storage helpers**

```typescript
// src/lib/photo-storage.ts
import { join } from 'node:path'
import { mkdir, unlink } from 'node:fs/promises'

const UPLOADS_ROOT = join(process.cwd(), 'uploads')

/** Full-resolution image path for a storageKey like "userId/uuid". */
export function photoPath(storageKey: string): string {
  return join(UPLOADS_ROOT, `${storageKey}.jpg`)
}

/** Thumbnail image path for a storageKey. */
export function thumbPath(storageKey: string): string {
  return join(UPLOADS_ROOT, `${storageKey}_thumb.jpg`)
}

/** Ensure the user's upload directory exists. */
export async function ensureUserDir(userId: string): Promise<void> {
  await mkdir(join(UPLOADS_ROOT, userId), { recursive: true })
}

/** Delete both full and thumb files for a storageKey. Ignores ENOENT. */
export async function deletePhotoFiles(storageKey: string): Promise<void> {
  const paths = [photoPath(storageKey), thumbPath(storageKey)]
  await Promise.all(
    paths.map((p) => unlink(p).catch((e: NodeJS.ErrnoException) => {
      if (e.code !== 'ENOENT') throw e
    }))
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/tests/lib/photo-storage.test.ts
```

Expected: 5/5 PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/photo-storage.ts src/tests/lib/photo-storage.test.ts
git commit -m "feat(m5): photo storage helpers (path, ensureDir, delete) + tests"
```

---

### Task 3: Photo processing (sharp) + tests

**Files:**
- Create: `src/lib/photo-processing.ts`
- Create: `src/tests/lib/photo-processing.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// src/tests/lib/photo-processing.test.ts
import { describe, it, expect, afterAll } from 'vitest'
import { processPhoto, type ProcessedPhoto } from '@/lib/photo-processing'
import sharp from 'sharp'
import { existsSync, rmSync } from 'node:fs'
import { join } from 'node:path'

const UPLOADS_ROOT = join(process.cwd(), 'uploads')
const TEST_USER = 'test_process_user_00001'

describe('processPhoto', () => {
  afterAll(() => {
    const dir = join(UPLOADS_ROOT, TEST_USER)
    if (existsSync(dir)) rmSync(dir, { recursive: true })
  })

  it('processes a JPEG buffer into full + thumb files', async () => {
    // Create a test image buffer (100x150 red rectangle)
    const inputBuffer = await sharp({
      create: { width: 100, height: 150, channels: 3, background: { r: 255, g: 0, b: 0 } },
    })
      .jpeg()
      .toBuffer()

    const result = await processPhoto(inputBuffer, TEST_USER)

    expect(result.storageKey).toMatch(new RegExp(`^${TEST_USER}/[\\w-]+$`))
    expect(result.widthPx).toBeLessThanOrEqual(2048)
    expect(result.heightPx).toBeLessThanOrEqual(2048)
    expect(result.byteSize).toBeGreaterThan(0)
    expect(existsSync(join(UPLOADS_ROOT, `${result.storageKey}.jpg`))).toBe(true)
    expect(existsSync(join(UPLOADS_ROOT, `${result.storageKey}_thumb.jpg`))).toBe(true)
  })

  it('resizes large images to max 2048px', async () => {
    const inputBuffer = await sharp({
      create: { width: 4000, height: 3000, channels: 3, background: { r: 0, g: 0, b: 255 } },
    })
      .jpeg()
      .toBuffer()

    const result = await processPhoto(inputBuffer, TEST_USER)

    expect(result.widthPx).toBeLessThanOrEqual(2048)
    expect(result.heightPx).toBeLessThanOrEqual(2048)
  })

  it('creates thumbnail at max 400px', async () => {
    const inputBuffer = await sharp({
      create: { width: 1000, height: 1500, channels: 3, background: { r: 0, g: 255, b: 0 } },
    })
      .jpeg()
      .toBuffer()

    const result = await processPhoto(inputBuffer, TEST_USER)

    const thumbMeta = await sharp(
      join(UPLOADS_ROOT, `${result.storageKey}_thumb.jpg`)
    ).metadata()
    expect(thumbMeta.width!).toBeLessThanOrEqual(400)
    expect(thumbMeta.height!).toBeLessThanOrEqual(400)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/tests/lib/photo-processing.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement photo processing**

```typescript
// src/lib/photo-processing.ts
import sharp from 'sharp'
import { randomUUID } from 'node:crypto'
import { ensureUserDir, photoPath, thumbPath } from './photo-storage'

export type ProcessedPhoto = {
  storageKey: string
  widthPx: number
  heightPx: number
  byteSize: number
}

const MAX_FULL = 2048
const MAX_THUMB = 400
const JPEG_QUALITY_FULL = 85
const JPEG_QUALITY_THUMB = 75

/**
 * Process an uploaded image buffer:
 * 1. Auto-orient (EXIF rotation)
 * 2. Resize to max 2048px (preserving aspect ratio)
 * 3. Strip EXIF metadata
 * 4. Save full + thumbnail to uploads/{userId}/
 *
 * Returns storageKey (userId/uuid) and dimensions.
 */
export async function processPhoto(
  buffer: Buffer,
  userId: string
): Promise<ProcessedPhoto> {
  await ensureUserDir(userId)
  const uuid = randomUUID()
  const storageKey = `${userId}/${uuid}`

  // Full resolution
  const fullResult = await sharp(buffer)
    .rotate() // auto-orient from EXIF
    .resize(MAX_FULL, MAX_FULL, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: JPEG_QUALITY_FULL })
    .toFile(photoPath(storageKey))

  // Thumbnail
  await sharp(buffer)
    .rotate()
    .resize(MAX_THUMB, MAX_THUMB, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: JPEG_QUALITY_THUMB })
    .toFile(thumbPath(storageKey))

  return {
    storageKey,
    widthPx: fullResult.width,
    heightPx: fullResult.height,
    byteSize: fullResult.size,
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/tests/lib/photo-processing.test.ts
```

Expected: 3/3 PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/photo-processing.ts src/tests/lib/photo-processing.test.ts
git commit -m "feat(m5): photo processing (sharp resize, EXIF strip, thumbnail) + tests"
```

---

### Task 4: Photo DB queries + tests

**Files:**
- Create: `src/lib/queries/photos.ts`
- Create: `src/tests/api/photos.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// src/tests/api/photos.test.ts
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
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/tests/api/photos.test.ts --no-file-parallelism
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement photo queries**

```typescript
// src/lib/queries/photos.ts
import { and, desc, eq, sql, lt } from 'drizzle-orm'
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

export async function getPhotoById(
  db: DB,
  userId: string,
  id: number
): Promise<PhotoItem | null> {
  const row = await db.query.bodyPhotos.findFirst({
    where: and(eq(bodyPhotos.id, id), eq(bodyPhotos.userId, userId)),
  })
  return row ?? null
}

export async function deletePhoto(
  db: DB,
  userId: string,
  id: number
): Promise<boolean> {
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
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/tests/api/photos.test.ts --no-file-parallelism
```

Expected: 7/7 PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/queries/photos.ts src/tests/api/photos.test.ts
git commit -m "feat(m5): photo DB queries (insert, list, get, delete, dates) + tests"
```

---

### Task 5: Photo upload API route (POST /api/photos)

**Files:**
- Create: `src/app/api/photos/route.ts`

- [ ] **Step 1: Implement upload + list route**

```typescript
// src/app/api/photos/route.ts
import { z } from 'zod'
import { db } from '@/db/client'
import { requireSessionUser } from '@/lib/auth-helpers'
import { processPhoto } from '@/lib/photo-processing'
import { insertPhoto, listPhotos } from '@/lib/queries/photos'
import { toWeekStart } from '@/lib/week'
import { awardXp } from '@/lib/xp'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB
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

  // Validate pose
  if (!pose || !POSES.includes(pose as (typeof POSES)[number])) {
    return new Response(JSON.stringify({ error: 'Invalid pose' }), { status: 400 })
  }

  // Validate date
  if (!takenAt || !/^\d{4}-\d{2}-\d{2}$/.test(takenAt)) {
    return new Response(JSON.stringify({ error: 'Invalid takenAt' }), { status: 400 })
  }

  // Validate file
  if (!file || !(file instanceof File)) {
    return new Response(JSON.stringify({ error: 'No file provided' }), { status: 400 })
  }
  if (file.size > MAX_FILE_SIZE) {
    return new Response(JSON.stringify({ error: 'File too large (max 10 MB)' }), { status: 400 })
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return new Response(JSON.stringify({ error: 'Invalid file type' }), { status: 400 })
  }

  // Process image
  const buffer = Buffer.from(await file.arrayBuffer())
  const processed = await processPhoto(buffer, user.id)

  // Insert DB record
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

  // Award XP
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
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/photos/route.ts
git commit -m "feat(m5): POST+GET /api/photos (upload + list)"
```

---

### Task 6: Photo serving + delete API routes

**Files:**
- Create: `src/app/api/photos/[id]/route.ts`
- Create: `src/app/api/photos/[id]/thumb/route.ts`
- Create: `src/app/api/photos/dates/route.ts`

- [ ] **Step 1: Implement full image serving + delete**

```typescript
// src/app/api/photos/[id]/route.ts
import { readFile } from 'node:fs/promises'
import { db } from '@/db/client'
import { requireSessionUser } from '@/lib/auth-helpers'
import { getPhotoById, deletePhoto } from '@/lib/queries/photos'
import { photoPath, deletePhotoFiles } from '@/lib/photo-storage'
import { reverseXp } from '@/lib/xp'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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
```

- [ ] **Step 2: Implement thumbnail serving**

```typescript
// src/app/api/photos/[id]/thumb/route.ts
import { readFile } from 'node:fs/promises'
import { db } from '@/db/client'
import { requireSessionUser } from '@/lib/auth-helpers'
import { getPhotoById } from '@/lib/queries/photos'
import { thumbPath } from '@/lib/photo-storage'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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
```

- [ ] **Step 3: Implement dates endpoint**

```typescript
// src/app/api/photos/dates/route.ts
import { db } from '@/db/client'
import { requireSessionUser } from '@/lib/auth-helpers'
import { getDistinctDates } from '@/lib/queries/photos'

export async function GET() {
  const user = await requireSessionUser()
  if (user instanceof Response) return user

  const dates = await getDistinctDates(db, user.id)
  return Response.json({ dates })
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/api/photos/[id]/route.ts src/app/api/photos/[id]/thumb/route.ts src/app/api/photos/dates/route.ts
git commit -m "feat(m5): photo serving (full+thumb), delete with XP reversal, dates endpoint"
```

---

### Task 7: Add "Fotky" tab to SegmentControl

**Files:**
- Modify: `src/components/ui/SegmentControl.tsx`

- [ ] **Step 1: Update ProgressSegmentControl**

In `src/components/ui/SegmentControl.tsx`, change the `ProgressSegmentControl` function. The current `active` detection chain is:

```typescript
const active = pathname?.startsWith('/progress/nutrition')
  ? '/progress/nutrition'
  : pathname?.startsWith('/progress/strength')
    ? '/progress/strength'
    : '/progress/body'
```

Change to:

```typescript
const active = pathname?.startsWith('/progress/nutrition')
  ? '/progress/nutrition'
  : pathname?.startsWith('/progress/strength')
    ? '/progress/strength'
    : pathname?.startsWith('/progress/photos')
      ? '/progress/photos'
      : '/progress/body'
```

And add the new segment to the array:

```typescript
segments={[
  { href: '/progress/body', label: 'Tělo' },
  { href: '/progress/nutrition', label: 'Výživa' },
  { href: '/progress/strength', label: 'Síla' },
  { href: '/progress/photos', label: 'Fotky' },
]}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ui/SegmentControl.tsx
git commit -m "feat(m5): add Fotky tab to progress segment control"
```

---

### Task 8: PoseBadge + UploadSheet components

**Files:**
- Create: `src/components/photos/PoseBadge.tsx`
- Create: `src/components/photos/UploadSheet.tsx`

- [ ] **Step 1: Create PoseBadge**

```typescript
// src/components/photos/PoseBadge.tsx
const POSE_LABELS: Record<string, string> = {
  front: 'F',
  side: 'S',
  back: 'B',
  other: 'O',
}

type Props = {
  pose: string
}

export function PoseBadge({ pose }: Props) {
  return (
    <span className="absolute right-1 bottom-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-bold text-white">
      {POSE_LABELS[pose] ?? pose[0]?.toUpperCase()}
    </span>
  )
}
```

- [ ] **Step 2: Create UploadSheet**

```typescript
// src/components/photos/UploadSheet.tsx
'use client'

import { useState, useRef } from 'react'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { useToast } from '@/components/ui/Toast'
import { useXpFeedback } from '@/components/xp/XpFeedbackProvider'

type Props = {
  open: boolean
  onOpenChange: (v: boolean) => void
  onUploaded: () => void
}

const POSES = [
  { value: 'front', label: 'Front' },
  { value: 'side', label: 'Side' },
  { value: 'back', label: 'Back' },
  { value: 'other', label: 'Other' },
] as const

export function UploadSheet({ open, onOpenChange, onUploaded }: Props) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [pose, setPose] = useState<string>('front')
  const [takenAt, setTakenAt] = useState(new Date().toISOString().slice(0, 10))
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const toast = useToast()
  const { notifyXp } = useXpFeedback()

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return

    let blob: File | Blob = f

    // Convert HEIC/HEIF client-side
    if (f.type === 'image/heic' || f.type === 'image/heif' || f.name.toLowerCase().endsWith('.heic')) {
      try {
        const heic2any = (await import('heic2any')).default
        blob = (await heic2any({ blob: f, toType: 'image/jpeg', quality: 0.9 })) as Blob
      } catch {
        toast.show('HEIC konverze selhala', 'error')
        return
      }
    }

    setFile(new File([blob], f.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' }))
    setPreview(URL.createObjectURL(blob))
  }

  const handleUpload = async () => {
    if (!file) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('pose', pose)
      formData.append('takenAt', takenAt)

      const res = await fetch('/api/photos', { method: 'POST', body: formData })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? `${res.status}`)
      }
      const body = await res.json()
      notifyXp(body)
      toast.show(`+${body.xpDelta} XP`, 'success')
      resetForm()
      onUploaded()
    } catch (e) {
      toast.show('Upload selhal', 'error')
    } finally {
      setUploading(false)
    }
  }

  const resetForm = () => {
    setFile(null)
    setPreview(null)
    setPose('front')
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title="Nahrát fotku">
      <div className="flex flex-col gap-3">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFile}
          className="text-sm text-[#6b7280] file:mr-2 file:rounded file:border-0 file:bg-[#1f2733] file:px-3 file:py-1.5 file:text-sm file:text-[#e5e7eb]"
        />

        {preview ? (
          <img
            src={preview}
            alt="Preview"
            className="mx-auto h-48 rounded-lg object-contain"
          />
        ) : null}

        <div className="flex gap-2">
          {POSES.map((p) => (
            <button
              key={p.value}
              onClick={() => setPose(p.value)}
              className={
                'flex-1 rounded-md px-2 py-1.5 text-sm transition-colors ' +
                (pose === p.value
                  ? 'bg-[#10b981] font-semibold text-[#0a0e14]'
                  : 'bg-[#1f2733] text-[#6b7280]')
              }
            >
              {p.label}
            </button>
          ))}
        </div>

        <input
          type="date"
          value={takenAt}
          onChange={(e) => setTakenAt(e.target.value)}
          className="rounded-lg border border-[#1f2733] bg-[#141a22] px-3 py-2 text-sm text-[#e5e7eb] outline-none"
        />

        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="flex h-12 items-center justify-center rounded-lg bg-[#10b981] font-semibold text-[#0a0e14] disabled:opacity-50"
        >
          {uploading ? 'Nahrávám…' : 'Nahrát'}
        </button>
      </div>
    </BottomSheet>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/photos/PoseBadge.tsx src/components/photos/UploadSheet.tsx
git commit -m "feat(m5): PoseBadge + UploadSheet components"
```

---

### Task 9: Lightbox component

**Files:**
- Create: `src/components/photos/Lightbox.tsx`

- [ ] **Step 1: Implement fullscreen lightbox**

```typescript
// src/components/photos/Lightbox.tsx
'use client'

import { useState } from 'react'
import { useToast } from '@/components/ui/Toast'
import { useXpFeedback } from '@/components/xp/XpFeedbackProvider'

type Photo = {
  id: number
  fullUrl: string
  takenAt: string
  pose: string
}

type Props = {
  photos: Photo[]
  initialIndex: number
  onClose: () => void
  onDeleted: () => void
}

export function Lightbox({ photos, initialIndex, onClose, onDeleted }: Props) {
  const [index, setIndex] = useState(initialIndex)
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const toast = useToast()
  const { notifyXp } = useXpFeedback()

  const photo = photos[index]
  if (!photo) return null

  const prev = () => setIndex((i) => Math.max(0, i - 1))
  const next = () => setIndex((i) => Math.min(photos.length - 1, i + 1))

  const handleDelete = async () => {
    if (!confirming) {
      setConfirming(true)
      return
    }
    setDeleting(true)
    try {
      const res = await fetch(`/api/photos/${photo.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      const body = await res.json()
      notifyXp(body)
      toast.show('Fotka smazána', 'success')
      onDeleted()
      onClose()
    } catch {
      toast.show('Smazání selhalo', 'error')
    } finally {
      setDeleting(false)
      setConfirming(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="flex items-center justify-between p-4">
        <span className="text-sm text-white/70">
          {photo.takenAt} · {photo.pose}
        </span>
        <div className="flex gap-3">
          <button
            onClick={handleDelete}
            disabled={deleting}
            className={
              'rounded px-3 py-1 text-sm ' +
              (confirming
                ? 'bg-[#ef4444] text-white'
                : 'text-[#ef4444]')
            }
          >
            {confirming ? 'Opravdu smazat?' : 'Smazat'}
          </button>
          <button onClick={onClose} className="text-white/70">
            ✕
          </button>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center overflow-hidden">
        <img
          src={photo.fullUrl}
          alt={`${photo.pose} ${photo.takenAt}`}
          className="max-h-full max-w-full object-contain"
        />
      </div>

      <div className="flex justify-between p-4">
        <button
          onClick={prev}
          disabled={index === 0}
          className="rounded px-4 py-2 text-white disabled:opacity-30"
        >
          ‹ Předchozí
        </button>
        <span className="self-center text-sm text-white/50">
          {index + 1} / {photos.length}
        </span>
        <button
          onClick={next}
          disabled={index === photos.length - 1}
          className="rounded px-4 py-2 text-white disabled:opacity-30"
        >
          Další ›
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/photos/Lightbox.tsx
git commit -m "feat(m5): Lightbox fullscreen photo viewer"
```

---

### Task 10: PhotoGrid + PhotoTimeline components

**Files:**
- Create: `src/components/photos/PhotoGrid.tsx`
- Create: `src/components/photos/PhotoTimeline.tsx`

- [ ] **Step 1: Create PhotoGrid**

```typescript
// src/components/photos/PhotoGrid.tsx
'use client'

import { PoseBadge } from './PoseBadge'

type PhotoItem = {
  id: number
  takenAt: string
  weekStart: string | null
  pose: string
  thumbUrl: string
}

type Props = {
  photos: PhotoItem[]
  onPhotoTap: (index: number) => void
}

export function PhotoGrid({ photos, onPhotoTap }: Props) {
  if (photos.length === 0) {
    return <p className="py-8 text-center text-sm text-[#6b7280]">Žádné fotky</p>
  }

  // Group by weekStart
  const groups = new Map<string, { photos: (PhotoItem & { globalIdx: number })[] }>()
  photos.forEach((p, i) => {
    const key = p.weekStart ?? p.takenAt
    let group = groups.get(key)
    if (!group) {
      group = { photos: [] }
      groups.set(key, group)
    }
    group.photos.push({ ...p, globalIdx: i })
  })

  return (
    <div className="flex flex-col gap-4">
      {Array.from(groups.entries()).map(([weekStart, group]) => (
        <div key={weekStart}>
          <h3 className="mb-2 text-xs font-medium text-[#6b7280]">
            Týden od {formatDate(weekStart)}
          </h3>
          <div className="grid grid-cols-3 gap-1.5">
            {group.photos.map((p) => (
              <button
                key={p.id}
                onClick={() => onPhotoTap(p.globalIdx)}
                className="relative aspect-square overflow-hidden rounded-lg"
              >
                <img
                  src={p.thumbUrl}
                  alt={`${p.pose} ${p.takenAt}`}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
                <PoseBadge pose={p.pose} />
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function formatDate(dateStr: string) {
  const [, m, d] = dateStr.split('-')
  return `${Number(d)}.${Number(m)}.`
}
```

- [ ] **Step 2: Create PhotoTimeline**

```typescript
// src/components/photos/PhotoTimeline.tsx
'use client'

type PhotoItem = {
  id: number
  takenAt: string
  pose: string
  thumbUrl: string
  note: string | null
}

type Props = {
  photos: PhotoItem[]
  onPhotoTap: (index: number) => void
}

const POSE_LABELS: Record<string, string> = {
  front: 'Zepředu',
  side: 'Z boku',
  back: 'Zezadu',
  other: 'Jiné',
}

export function PhotoTimeline({ photos, onPhotoTap }: Props) {
  if (photos.length === 0) {
    return <p className="py-8 text-center text-sm text-[#6b7280]">Žádné fotky</p>
  }

  return (
    <div className="flex flex-col gap-3">
      {photos.map((p, i) => (
        <button
          key={p.id}
          onClick={() => onPhotoTap(i)}
          className="flex gap-3 rounded-lg border border-[#1f2733] bg-[#141a22] p-2 text-left"
        >
          <img
            src={p.thumbUrl}
            alt={`${p.pose} ${p.takenAt}`}
            className="h-24 w-24 rounded-md object-cover"
            loading="lazy"
          />
          <div className="flex flex-col justify-center">
            <span className="text-sm font-medium text-[#e5e7eb]">{formatDate(p.takenAt)}</span>
            <span className="text-xs text-[#6b7280]">{POSE_LABELS[p.pose] ?? p.pose}</span>
            {p.note ? <span className="mt-1 text-xs text-[#6b7280]">{p.note}</span> : null}
          </div>
        </button>
      ))}
    </div>
  )
}

function formatDate(dateStr: string) {
  const [y, m, d] = dateStr.split('-')
  return `${Number(d)}.${Number(m)}.${y}`
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/photos/PhotoGrid.tsx src/components/photos/PhotoTimeline.tsx
git commit -m "feat(m5): PhotoGrid + PhotoTimeline view components"
```

---

### Task 11: BeforeAfter comparison component

**Files:**
- Create: `src/components/photos/BeforeAfter.tsx`

- [ ] **Step 1: Implement before/after comparison**

```typescript
// src/components/photos/BeforeAfter.tsx
'use client'

import { useState, useEffect } from 'react'

type PhotoItem = {
  id: number
  takenAt: string
  pose: string
  fullUrl: string
  thumbUrl: string
}

type Props = {
  photos: PhotoItem[]
  dates: string[]
}

const POSES = [
  { value: '', label: 'Vše' },
  { value: 'front', label: 'Front' },
  { value: 'side', label: 'Side' },
  { value: 'back', label: 'Back' },
] as const

export function BeforeAfter({ photos, dates }: Props) {
  const [poseFilter, setPoseFilter] = useState('')
  const [beforeDate, setBeforeDate] = useState(dates[dates.length - 1] ?? '')
  const [afterDate, setAfterDate] = useState(dates[0] ?? '')
  const [sliderPos, setSliderPos] = useState(50)

  const filtered = poseFilter ? photos.filter((p) => p.pose === poseFilter) : photos
  const beforePhoto = filtered.find((p) => p.takenAt === beforeDate)
  const afterPhoto = filtered.find((p) => p.takenAt === afterDate)

  if (dates.length < 2) {
    return (
      <p className="py-8 text-center text-sm text-[#6b7280]">
        Potřebuješ alespoň fotky ze 2 různých dní
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        {POSES.map((p) => (
          <button
            key={p.value}
            onClick={() => setPoseFilter(p.value)}
            className={
              'flex-1 rounded-md px-2 py-1.5 text-xs transition-colors ' +
              (poseFilter === p.value
                ? 'bg-[#10b981] font-semibold text-[#0a0e14]'
                : 'bg-[#1f2733] text-[#6b7280]')
            }
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <select
          value={beforeDate}
          onChange={(e) => setBeforeDate(e.target.value)}
          className="flex-1 rounded-lg border border-[#1f2733] bg-[#141a22] px-2 py-1.5 text-sm text-[#e5e7eb]"
        >
          {dates.map((d) => (
            <option key={d} value={d}>
              {formatDate(d)}
            </option>
          ))}
        </select>
        <span className="self-center text-sm text-[#6b7280]">→</span>
        <select
          value={afterDate}
          onChange={(e) => setAfterDate(e.target.value)}
          className="flex-1 rounded-lg border border-[#1f2733] bg-[#141a22] px-2 py-1.5 text-sm text-[#e5e7eb]"
        >
          {dates.map((d) => (
            <option key={d} value={d}>
              {formatDate(d)}
            </option>
          ))}
        </select>
      </div>

      {beforePhoto && afterPhoto ? (
        <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg">
          <img
            src={afterPhoto.fullUrl}
            alt={`After ${afterDate}`}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div
            className="absolute inset-0 overflow-hidden"
            style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
          >
            <img
              src={beforePhoto.fullUrl}
              alt={`Before ${beforeDate}`}
              className="h-full w-full object-cover"
            />
          </div>
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-white"
            style={{ left: `${sliderPos}%` }}
          >
            <div className="absolute top-1/2 left-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-black/50" />
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={sliderPos}
            onChange={(e) => setSliderPos(Number(e.target.value))}
            className="absolute inset-0 h-full w-full cursor-col-resize opacity-0"
          />
          <span className="absolute top-2 left-2 rounded bg-black/60 px-2 py-0.5 text-xs text-white">
            Před
          </span>
          <span className="absolute top-2 right-2 rounded bg-black/60 px-2 py-0.5 text-xs text-white">
            Po
          </span>
        </div>
      ) : (
        <p className="py-8 text-center text-sm text-[#6b7280]">
          Žádná fotka pro vybranou kombinaci
        </p>
      )}
    </div>
  )
}

function formatDate(dateStr: string) {
  const [y, m, d] = dateStr.split('-')
  return `${Number(d)}.${Number(m)}.${y}`
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/photos/BeforeAfter.tsx
git commit -m "feat(m5): BeforeAfter comparison component with overlay slider"
```

---

### Task 12: Photos page + PhotosPageClient wiring

**Files:**
- Create: `src/app/(app)/progress/photos/page.tsx`
- Create: `src/components/photos/PhotosPageClient.tsx`

- [ ] **Step 1: Create server page**

```typescript
// src/app/(app)/progress/photos/page.tsx
import { requireSessionUser } from '@/lib/auth-helpers'
import { redirect } from 'next/navigation'
import { PhotosPageClient } from '@/components/photos/PhotosPageClient'

export default async function PhotosPage() {
  const user = await requireSessionUser()
  if (user instanceof Response) redirect('/login')
  return <PhotosPageClient />
}
```

- [ ] **Step 2: Create PhotosPageClient**

```typescript
// src/components/photos/PhotosPageClient.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { PhotoGrid } from './PhotoGrid'
import { PhotoTimeline } from './PhotoTimeline'
import { BeforeAfter } from './BeforeAfter'
import { UploadSheet } from './UploadSheet'
import { Lightbox } from './Lightbox'

type PhotoItem = {
  id: number
  takenAt: string
  weekStart: string | null
  pose: string
  thumbUrl: string
  fullUrl: string
  widthPx: number | null
  heightPx: number | null
  note: string | null
  createdAt: string
}

type ViewMode = 'grid' | 'timeline' | 'compare'

const VIEW_OPTIONS = [
  { value: 'grid', label: 'Grid' },
  { value: 'timeline', label: 'Timeline' },
  { value: 'compare', label: 'Před×Po' },
] as const

export function PhotosPageClient() {
  const [view, setView] = useState<ViewMode>('grid')
  const [photos, setPhotos] = useState<PhotoItem[]>([])
  const [dates, setDates] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const loadPhotos = useCallback(async () => {
    setLoading(true)
    const [photosRes, datesRes] = await Promise.all([
      fetch('/api/photos?limit=200').then((r) => r.json()),
      fetch('/api/photos/dates').then((r) => r.json()),
    ])
    setPhotos(photosRes.items ?? [])
    setDates(datesRes.dates ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    loadPhotos()
  }, [loadPhotos])

  return (
    <div className="flex flex-col gap-3">
      <div role="tablist" className="flex gap-1 rounded-lg bg-[#141a22] p-1">
        {VIEW_OPTIONS.map((o) => (
          <button
            key={o.value}
            role="tab"
            aria-selected={view === o.value}
            onClick={() => setView(o.value)}
            className={
              'flex-1 rounded-md px-3 py-1.5 text-center text-sm transition-colors ' +
              (view === o.value
                ? 'bg-[#10b981] font-semibold text-[#0a0e14]'
                : 'text-[#6b7280] hover:text-[#e5e7eb]')
            }
          >
            {o.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="py-8 text-center text-sm text-[#6b7280]">Načítám...</p>
      ) : view === 'grid' ? (
        <PhotoGrid photos={photos} onPhotoTap={setLightboxIndex} />
      ) : view === 'timeline' ? (
        <PhotoTimeline photos={photos} onPhotoTap={setLightboxIndex} />
      ) : (
        <BeforeAfter photos={photos} dates={dates} />
      )}

      <button
        onClick={() => setUploadOpen(true)}
        className="fixed right-4 bottom-20 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-[#10b981] text-2xl font-bold text-[#0a0e14] shadow-lg"
        aria-label="Nahrát fotku"
      >
        +
      </button>

      <UploadSheet
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onUploaded={loadPhotos}
      />

      {lightboxIndex !== null ? (
        <Lightbox
          photos={photos.map((p) => ({
            id: p.id,
            fullUrl: p.fullUrl,
            takenAt: p.takenAt,
            pose: p.pose,
          }))}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onDeleted={loadPhotos}
        />
      ) : null}
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/\(app\)/progress/photos/page.tsx src/components/photos/PhotosPageClient.tsx
git commit -m "feat(m5): /progress/photos page with grid, timeline, before/after views"
```

---

### Task 13: Typecheck + test suite

**Files:** none (verification only)

- [ ] **Step 1: Run typecheck**

```bash
npx tsc --noEmit
```

Expected: clean. Fix any issues.

- [ ] **Step 2: Run full test suite**

```bash
npx vitest run --no-file-parallelism
```

Expected: all tests pass (151 existing + ~15 new ≈ 166). Fix any failures.

- [ ] **Step 3: Commit fixes if needed**

---

### Task 14: E2E spec for photos

**Files:**
- Create: `tests/e2e/photos.spec.ts`

- [ ] **Step 1: Write E2E spec**

```typescript
// tests/e2e/photos.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Body photos page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[name="email"]', 'demo@hexis.local')
    await page.fill('input[name="password"]', 'Demo1234')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')
  })

  test('navigates to photos tab and shows empty state', async ({ page }) => {
    await page.goto('/progress/photos')
    await expect(page.getByRole('tab', { name: 'Fotky' })).toHaveAttribute(
      'aria-selected',
      'true'
    )
    await expect(page.getByText('Žádné fotky')).toBeVisible()
  })

  test('upload FAB opens sheet', async ({ page }) => {
    await page.goto('/progress/photos')
    await page.getByLabel('Nahrát fotku').click()
    await expect(page.getByText('Nahrát fotku')).toBeVisible()
  })
})
```

- [ ] **Step 2: Commit**

```bash
git add tests/e2e/photos.spec.ts
git commit -m "test(m5): E2E spec for body photos page"
```

---

### Task 15: Update roadmap

**Files:**
- Modify: `docs/superpowers/roadmap/hexis-roadmap.md`

- [ ] **Step 1: Mark M5 items as done in roadmap**

In the Progres tracking section, change:

```markdown
### Progres tracking
- [x] Weekly measurements grid (inline edit, save on blur)
- [x] Nutrition kalendář s heat map + daily modal
- [ ] Body photos upload (HEIC konverze, EXIF strip, thumbnail)
- [ ] Photo views: Grid / Timeline / Před×Po / Timelapse
```

To:

```markdown
### Progres tracking
- [x] Weekly measurements grid (inline edit, save on blur)
- [x] Nutrition kalendář s heat map + daily modal
- [x] Body photos upload (HEIC konverze, EXIF strip, thumbnail)
- [x] Photo views: Grid / Timeline / Před×Po (Timelapse deferred)
```

- [ ] **Step 2: Commit**

```bash
git add docs/superpowers/roadmap/hexis-roadmap.md
git commit -m "docs(m5): mark body photos milestone complete"
```

---

## Summary

| Task | Description | Tests |
|------|-------------|-------|
| 1 | Branch + deps | — |
| 2 | photo-storage.ts helpers | 5 unit |
| 3 | photo-processing.ts (sharp) | 3 unit |
| 4 | Photo DB queries | 7 integration |
| 5 | POST+GET /api/photos | — |
| 6 | Serving + delete + dates routes | — |
| 7 | SegmentControl photos tab | — |
| 8 | PoseBadge + UploadSheet | — |
| 9 | Lightbox | — |
| 10 | PhotoGrid + PhotoTimeline | — |
| 11 | BeforeAfter comparison | — |
| 12 | Photos page + wiring | — |
| 13 | Typecheck + full test suite | verification |
| 14 | E2E spec | 2 E2E |
| 15 | Roadmap update | — |

**Total new tests:** ~17 (8 unit + 7 integration + 2 E2E)
