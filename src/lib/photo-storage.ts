import { join, resolve } from 'node:path'
import { mkdir, unlink } from 'node:fs/promises'

// STORAGE_ROOT points at persistent storage outside the app folder (Docker volume, hosting home dir).
const UPLOADS_ROOT = resolve(process.env.STORAGE_ROOT ?? 'uploads')

export function photoPath(storageKey: string): string {
  return join(UPLOADS_ROOT, `${storageKey}.jpg`)
}

export function thumbPath(storageKey: string): string {
  return join(UPLOADS_ROOT, `${storageKey}_thumb.jpg`)
}

export async function ensureUserDir(userId: string): Promise<void> {
  await mkdir(join(UPLOADS_ROOT, userId), { recursive: true })
}

export async function deletePhotoFiles(storageKey: string): Promise<void> {
  const paths = [photoPath(storageKey), thumbPath(storageKey)]
  await Promise.all(
    paths.map((p) =>
      unlink(p).catch((e: NodeJS.ErrnoException) => {
        if (e.code !== 'ENOENT') throw e
      })
    )
  )
}
