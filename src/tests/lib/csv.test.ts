import { describe, it, expect } from 'vitest'
import { toCsv } from '@/lib/csv'

describe('toCsv', () => {
  it('converts array of objects to CSV string', () => {
    const data = [
      { name: 'Bench', weight: 80 },
      { name: 'Squat', weight: 100 },
    ]
    const result = toCsv(data, ['name', 'weight'])
    expect(result).toBe('name,weight\nBench,80\nSquat,100')
  })

  it('escapes commas and quotes', () => {
    const data = [{ note: 'good, very good' }, { note: 'he said "wow"' }]
    const result = toCsv(data, ['note'])
    expect(result).toBe('note\n"good, very good"\n"he said ""wow"""')
  })

  it('handles null and undefined values', () => {
    const data = [
      { a: null, b: undefined },
      { a: 1, b: 2 },
    ]
    const result = toCsv(data, ['a', 'b'])
    expect(result).toBe('a,b\n,\n1,2')
  })

  it('returns only header for empty data', () => {
    const result = toCsv([], ['a', 'b'])
    expect(result).toBe('a,b')
  })
})
