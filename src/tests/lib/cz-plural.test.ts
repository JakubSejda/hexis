import { describe, it, expect } from 'vitest'
import { czPlural, DAYS } from '@/lib/cz-plural'

describe('czPlural', () => {
  it.each([
    [0, 'dní'],
    [1, 'den'],
    [2, 'dny'],
    [4, 'dny'],
    [5, 'dní'],
    [12, 'dní'],
    [22, 'dní'],
  ])('%i → %s', (n, form) => {
    expect(czPlural(n, DAYS)).toBe(form)
  })
})
