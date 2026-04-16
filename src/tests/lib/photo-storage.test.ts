import { describe, it, expect, afterAll } from 'vitest'
import { photoPath, thumbPath, ensureUserDir, deletePhotoFiles } from '@/lib/photo-storage'
import { existsSync, writeFileSync, rmSync } from 'node:fs'
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
