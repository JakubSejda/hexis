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

export async function processPhoto(buffer: Buffer, userId: string): Promise<ProcessedPhoto> {
  await ensureUserDir(userId)
  const uuid = randomUUID()
  const storageKey = `${userId}/${uuid}`

  const fullResult = await sharp(buffer)
    .rotate()
    .resize(MAX_FULL, MAX_FULL, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: JPEG_QUALITY_FULL })
    .toFile(photoPath(storageKey))

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
