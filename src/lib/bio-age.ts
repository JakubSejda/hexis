export function ageFromBirthDate(birthDate: string | null, today: Date): number | null {
  if (!birthDate) return null
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthDate)
  if (!m) return null
  const by = Number(m[1])
  const bm = Number(m[2])
  const bd = Number(m[3])
  const ty = today.getUTCFullYear()
  const tm = today.getUTCMonth() + 1
  const td = today.getUTCDate()
  let age = ty - by
  if (tm < bm || (tm === bm && td < bd)) age -= 1
  return Math.max(0, age)
}
