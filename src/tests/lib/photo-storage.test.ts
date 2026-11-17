import { describe, it, expect, afterAll, vi } from 'vitest'
import { photoPath, thumbPath, ensureUserDir, deletePhotoFiles } from '@/lib/photo-storage'
import { existsSync, writeFileSync, rmSync } from 'node:fs'
import { join, resolve } from 'node:path'

const UPLOADS_ROOT = resolve(process.env.STORAGE_ROOT ?? 'uploads')
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

describe('photo-storage STORAGE_ROOT', () => {
  it('writes under STORAGE_ROOT, so a persistent volume outside the app folder is honoured', async () => {
    vi.resetModules()
    const before = process.env.STORAGE_ROOT
    process.env.STORAGE_ROOT = '/data/uploads'
    try {
      const mod = await import('@/lib/photo-storage')
      expect(mod.photoPath('u1/p')).toBe(join(resolve('/data/uploads'), 'u1', 'p.jpg'))
    } finally {
      if (before === undefined) delete process.env.STORAGE_ROOT
      else process.env.STORAGE_ROOT = before
      vi.resetModules()
    }
  })
})
