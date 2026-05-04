const MAX_OFFSET = 840

export function resolveUserToday(offsetHeader: string | null, now: Date = new Date()): string {
  let offsetMin = 0
  if (offsetHeader) {
    const parsed = Number(offsetHeader)
    if (Number.isFinite(parsed)) {
      offsetMin = Math.max(-MAX_OFFSET, Math.min(MAX_OFFSET, parsed))
    }
  }
  const localMs = now.getTime() - offsetMin * 60_000
  const local = new Date(localMs)
  const y = local.getUTCFullYear()
  const m = String(local.getUTCMonth() + 1).padStart(2, '0')
  const d = String(local.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
