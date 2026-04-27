import { describe, it, expect } from 'vitest'
import { MUSCLE_GROUPS } from '@/db/seed/muscle-groups'
import { EXERCISES } from '@/db/seed/exercises'

describe('seed integrity', () => {
  const slugs = new Set<string>(MUSCLE_GROUPS.map((mg) => mg.slug))

  it('every exercise primary slug exists in MUSCLE_GROUPS', () => {
    const offenders = EXERCISES.filter((ex) => !slugs.has(ex.primary)).map(
      (ex) => `${ex.name} → primary "${ex.primary}"`
    )
    expect(offenders).toEqual([])
  })

  it('every exercise secondary slug exists in MUSCLE_GROUPS', () => {
    const offenders: string[] = []
    for (const ex of EXERCISES) {
      for (const sec of ex.secondary ?? []) {
        if (!slugs.has(sec)) offenders.push(`${ex.name} → secondary "${sec}"`)
      }
    }
    expect(offenders).toEqual([])
  })

  it('all slugs are unique', () => {
    expect(new Set<string>(MUSCLE_GROUPS.map((mg) => mg.slug)).size).toBe(MUSCLE_GROUPS.length)
  })
})
