import { describe, it, expect } from 'vitest'
import { rewardCreateSchema, rewardPatchSchema, redeemSchema } from '@/lib/validators/rewards'

describe('rewardCreateSchema', () => {
  it('accepts valid input', () => {
    const result = rewardCreateSchema.safeParse({ name: 'sushi', costXp: 100 })
    expect(result.success).toBe(true)
  })

  it('rejects empty name', () => {
    const result = rewardCreateSchema.safeParse({ name: '', costXp: 100 })
    expect(result.success).toBe(false)
  })

  it('rejects name over 80 chars', () => {
    const result = rewardCreateSchema.safeParse({ name: 'a'.repeat(81), costXp: 100 })
    expect(result.success).toBe(false)
  })

  it('rejects costXp <= 0', () => {
    expect(rewardCreateSchema.safeParse({ name: 'x', costXp: 0 }).success).toBe(false)
    expect(rewardCreateSchema.safeParse({ name: 'x', costXp: -1 }).success).toBe(false)
  })

  it('rejects costXp > 999_999', () => {
    expect(rewardCreateSchema.safeParse({ name: 'x', costXp: 1_000_000 }).success).toBe(false)
  })

  it('accepts optional description up to 280 chars', () => {
    expect(
      rewardCreateSchema.safeParse({ name: 'x', costXp: 1, description: 'a'.repeat(280) }).success
    ).toBe(true)
    expect(
      rewardCreateSchema.safeParse({ name: 'x', costXp: 1, description: 'a'.repeat(281) }).success
    ).toBe(false)
  })

  it('trims name', () => {
    const r = rewardCreateSchema.safeParse({ name: '  sushi  ', costXp: 1 })
    expect(r.success && r.data.name).toBe('sushi')
  })
})

describe('rewardPatchSchema', () => {
  it('accepts archivedAt = null (un-archive) and Date (archive)', () => {
    expect(rewardPatchSchema.safeParse({ archivedAt: null }).success).toBe(true)
    expect(rewardPatchSchema.safeParse({ archivedAt: new Date().toISOString() }).success).toBe(true)
  })

  it('rejects empty patch object', () => {
    expect(rewardPatchSchema.safeParse({}).success).toBe(false)
  })
})

describe('redeemSchema', () => {
  it('accepts empty body', () => {
    expect(redeemSchema.safeParse({}).success).toBe(true)
  })

  it('accepts note up to 280 chars', () => {
    expect(redeemSchema.safeParse({ note: 'k narozeninám' }).success).toBe(true)
    expect(redeemSchema.safeParse({ note: 'a'.repeat(281) }).success).toBe(false)
  })
})
