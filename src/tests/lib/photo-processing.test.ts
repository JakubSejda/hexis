import { describe, it, expect, afterAll } from 'vitest'
import { processPhoto } from '@/lib/photo-processing'
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
    const thumbMeta = await sharp(join(UPLOADS_ROOT, `${result.storageKey}_thumb.jpg`)).metadata()
    expect(thumbMeta.width!).toBeLessThanOrEqual(400)
    expect(thumbMeta.height!).toBeLessThanOrEqual(400)
  })
})
