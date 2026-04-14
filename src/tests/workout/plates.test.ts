import { describe, it, expect } from 'vitest'
import { calculatePlates } from '@/lib/plates'

const IPF_20 = {
  bar: { weightKg: 20 },
  inventory: [
    { weightKg: 25, pairs: 2 },
    { weightKg: 20, pairs: 2 },
    { weightKg: 15, pairs: 2 },
    { weightKg: 10, pairs: 2 },
    { weightKg: 5, pairs: 2 },
    { weightKg: 2.5, pairs: 2 },
    { weightKg: 1.25, pairs: 2 },
  ],
}

describe('calculatePlates', () => {
  it('target == bar → empty plates', () => {
    const r = calculatePlates({ targetKg: 20, ...IPF_20 })
    expect(r.perSide).toEqual([])
    expect(r.missingKg).toBe(0)
  })

  it('target < bar throws', () => {
    expect(() => calculatePlates({ targetKg: 10, ...IPF_20 })).toThrow(/pod/)
  })

  it('60 kg on 20 kg bar → 20 per side', () => {
    const r = calculatePlates({ targetKg: 60, ...IPF_20 })
    expect(r.perSide).toEqual([{ weightKg: 20, count: 1 }])
    expect(r.missingKg).toBe(0)
  })

  it('100 kg on 20 kg bar → 25+10+5 per side', () => {
    const r = calculatePlates({ targetKg: 100, ...IPF_20 })
    expect(r.perSide).toEqual([
      { weightKg: 25, count: 1 },
      { weightKg: 10, count: 1 },
      { weightKg: 5, count: 1 },
    ])
  })

  it('140 kg on 20 kg bar → 25×2 + 10 per side', () => {
    const r = calculatePlates({ targetKg: 140, ...IPF_20 })
    expect(r.perSide).toEqual([
      { weightKg: 25, count: 2 },
      { weightKg: 10, count: 1 },
    ])
  })

  it('limits by available pairs', () => {
    const r = calculatePlates({
      targetKg: 100,
      bar: { weightKg: 20 },
      inventory: [
        { weightKg: 25, pairs: 1 },
        { weightKg: 15, pairs: 1 },
      ],
    })
    expect(r.perSide).toEqual([
      { weightKg: 25, count: 1 },
      { weightKg: 15, count: 1 },
    ])
    expect(r.missingKg).toBe(0)
  })

  it('returns missingKg when inventory is insufficient', () => {
    const r = calculatePlates({
      targetKg: 100,
      bar: { weightKg: 20 },
      inventory: [{ weightKg: 10, pairs: 1 }],
    })
    expect(r.perSide).toEqual([{ weightKg: 10, count: 1 }])
    expect(r.missingKg).toBeCloseTo(60, 5)
  })

  it('15 kg women bar + 52.5 kg target', () => {
    const r = calculatePlates({
      targetKg: 52.5,
      bar: { weightKg: 15 },
      inventory: IPF_20.inventory,
    })
    expect(r.perSide).toEqual([
      { weightKg: 15, count: 1 },
      { weightKg: 2.5, count: 1 },
      { weightKg: 1.25, count: 1 },
    ])
    expect(r.missingKg).toBe(0)
  })
})
