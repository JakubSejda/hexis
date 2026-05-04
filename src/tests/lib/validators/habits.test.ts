import { describe, it, expect } from 'vitest'
import { habitCreateSchema, habitPatchSchema, habitCheckSchema } from '@/lib/validators/habits'

describe('habitCreateSchema', () => {
  it('accepts a valid daily habit', () => {
    const r = habitCreateSchema.safeParse({
      name: 'Voda',
      cadence: 'daily',
      weight: 'standard',
    })
    expect(r.success).toBe(true)
  })

  it('rejects a daily habit with weeklyTarget', () => {
    const r = habitCreateSchema.safeParse({
      name: 'Voda',
      cadence: 'daily',
      weeklyTarget: 3,
      weight: 'standard',
    })
    expect(r.success).toBe(false)
  })

  it('accepts a weekly habit with target 1..7', () => {
    for (const t of [1, 3, 7]) {
      const r = habitCreateSchema.safeParse({
        name: 'Meditace',
        cadence: 'weekly',
        weeklyTarget: t,
        weight: 'light',
      })
      expect(r.success).toBe(true)
    }
  })

  it('rejects a weekly habit without weeklyTarget', () => {
    const r = habitCreateSchema.safeParse({
      name: 'Meditace',
      cadence: 'weekly',
      weight: 'light',
    })
    expect(r.success).toBe(false)
  })

  it('rejects weeklyTarget out of 1..7', () => {
    for (const t of [0, -1, 8, 100]) {
      const r = habitCreateSchema.safeParse({
        name: 'Meditace',
        cadence: 'weekly',
        weeklyTarget: t,
        weight: 'standard',
      })
      expect(r.success).toBe(false)
    }
  })

  it('trims name whitespace', () => {
    const r = habitCreateSchema.safeParse({
      name: '  Voda  ',
      cadence: 'daily',
      weight: 'standard',
    })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.name).toBe('Voda')
  })

  it('rejects empty name after trim', () => {
    const r = habitCreateSchema.safeParse({
      name: '   ',
      cadence: 'daily',
      weight: 'standard',
    })
    expect(r.success).toBe(false)
  })

  it('rejects name longer than 80 chars', () => {
    const r = habitCreateSchema.safeParse({
      name: 'a'.repeat(81),
      cadence: 'daily',
      weight: 'standard',
    })
    expect(r.success).toBe(false)
  })

  it('defaults weight to standard if omitted', () => {
    const r = habitCreateSchema.safeParse({ name: 'Voda', cadence: 'daily' })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.weight).toBe('standard')
  })
})

describe('habitPatchSchema', () => {
  it('accepts name-only patch', () => {
    expect(habitPatchSchema.safeParse({ name: 'Nový název' }).success).toBe(true)
  })

  it('accepts weight-only patch', () => {
    expect(habitPatchSchema.safeParse({ weight: 'heavy' }).success).toBe(true)
  })

  it('rejects empty patch', () => {
    expect(habitPatchSchema.safeParse({}).success).toBe(false)
  })

  it('rejects cadence patch (immutable)', () => {
    expect(habitPatchSchema.safeParse({ cadence: 'weekly' }).success).toBe(false)
  })

  it('rejects weeklyTarget patch (immutable)', () => {
    expect(habitPatchSchema.safeParse({ weeklyTarget: 5 }).success).toBe(false)
  })
})

describe('habitCheckSchema', () => {
  it('accepts YYYY-MM-DD', () => {
    expect(habitCheckSchema.safeParse({ date: '2026-04-29' }).success).toBe(true)
  })

  it('rejects malformed date', () => {
    expect(habitCheckSchema.safeParse({ date: '29-04-2026' }).success).toBe(false)
    expect(habitCheckSchema.safeParse({ date: '2026/04/29' }).success).toBe(false)
    expect(habitCheckSchema.safeParse({ date: '2026-4-29' }).success).toBe(false)
  })
})
