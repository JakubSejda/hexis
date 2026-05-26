import { describe, it, expect } from 'vitest'
import { profileUpdateSchema } from '@/lib/validators/profile'

describe('profileUpdateSchema', () => {
  it('accepts a fully populated payload', () => {
    const r = profileUpdateSchema.safeParse({
      name: 'Jakub',
      birthDate: '1990-01-15',
      gender: 'male',
      heightCm: 180,
      goalKg: 78.5,
      goalText: 'Pull 10 reps na 100 kg',
      startedAt: '2024-06-01',
    })
    expect(r.success).toBe(true)
  })

  it('accepts an empty payload (all optional)', () => {
    expect(profileUpdateSchema.safeParse({}).success).toBe(true)
  })

  it('accepts explicit nulls (clears field)', () => {
    const r = profileUpdateSchema.safeParse({
      name: null,
      birthDate: null,
      gender: null,
      heightCm: null,
      goalKg: null,
      goalText: null,
      startedAt: null,
    })
    expect(r.success).toBe(true)
  })

  it('rejects too-short name', () => {
    expect(profileUpdateSchema.safeParse({ name: '' }).success).toBe(false)
  })

  it('rejects name > 100 chars', () => {
    expect(profileUpdateSchema.safeParse({ name: 'x'.repeat(101) }).success).toBe(false)
  })

  it('rejects heightCm out of range', () => {
    expect(profileUpdateSchema.safeParse({ heightCm: 49 }).success).toBe(false)
    expect(profileUpdateSchema.safeParse({ heightCm: 251 }).success).toBe(false)
  })

  it('rejects goalKg out of range', () => {
    expect(profileUpdateSchema.safeParse({ goalKg: 29.9 }).success).toBe(false)
    expect(profileUpdateSchema.safeParse({ goalKg: 301 }).success).toBe(false)
  })

  it('rejects goalText > 120 chars', () => {
    expect(profileUpdateSchema.safeParse({ goalText: 'x'.repeat(121) }).success).toBe(false)
  })

  it('rejects bad date strings', () => {
    expect(profileUpdateSchema.safeParse({ birthDate: '1990/01/15' }).success).toBe(false)
    expect(profileUpdateSchema.safeParse({ startedAt: 'today' }).success).toBe(false)
  })

  it('rejects birthDate before 1900', () => {
    expect(profileUpdateSchema.safeParse({ birthDate: '1899-12-31' }).success).toBe(false)
  })

  it('rejects unknown gender', () => {
    expect(profileUpdateSchema.safeParse({ gender: 'unknown' }).success).toBe(false)
  })
})
