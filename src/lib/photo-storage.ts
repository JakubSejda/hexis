import { join } from 'node:path'
import { mkdir, unlink } from 'node:fs/promises'

const UPLOADS_ROOT = join(process.cwd(), 'uploads')

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
