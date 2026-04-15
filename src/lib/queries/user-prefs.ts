import { eq } from 'drizzle-orm'
import type { MySql2Database } from 'drizzle-orm/mysql2'
import * as schema from '@/db/schema'
import { users, type MacroKey } from '@/db/schema'

type DB = MySql2Database<typeof schema>

export const ALL_MACROS = [
  'kcal',
  'protein',
  'carbs',
  'fat',
  'sugar',
] as const satisfies readonly MacroKey[]
export const REQUIRED_MACROS: MacroKey[] = ['kcal', 'protein']

export async function getMacros(db: DB, userId: string): Promise<MacroKey[]> {
  const row = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { trackedMacros: true },
  })
  const arr = (row?.trackedMacros ?? ['kcal', 'protein']) as string[]
  return arr.filter((m): m is MacroKey => (ALL_MACROS as readonly string[]).includes(m))
}

/**
 * Sets tracked macros. Always coerces to include kcal + protein.
 * Throws if input contains an unknown macro.
 */
export async function setMacros(db: DB, userId: string, macros: string[]): Promise<MacroKey[]> {
  for (const m of macros) {
    if (!(ALL_MACROS as readonly string[]).includes(m)) {
      throw new Error(`unknown macro: ${m}`)
    }
  }
  const set = new Set<MacroKey>([...REQUIRED_MACROS, ...(macros as MacroKey[])])
  const ordered = ALL_MACROS.filter((m) => set.has(m))
  await db.update(users).set({ trackedMacros: ordered }).where(eq(users.id, userId))
  return ordered
}
