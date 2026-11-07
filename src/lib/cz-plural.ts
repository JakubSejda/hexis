/** Czech count noun: 1 den · 2–4 dny · 0 or 5+ dní. */
export function czPlural(
  n: number,
  forms: readonly [one: string, few: string, many: string]
): string {
  const abs = Math.abs(n)
  if (abs === 1) return forms[0]
  if (abs >= 2 && abs <= 4) return forms[1]
  return forms[2]
}

export const DAYS = ['den', 'dny', 'dní'] as const
