import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createRateLimiter } from '@/lib/ratelimit'

describe('rate limiter (sliding window)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  it('allows requests under limit', () => {
    const rl = createRateLimiter({ limit: 3, windowMs: 60_000 })
    expect(rl.check('key1')).toEqual({ allowed: true, remaining: 2 })
    expect(rl.check('key1')).toEqual({ allowed: true, remaining: 1 })
    expect(rl.check('key1')).toEqual({ allowed: true, remaining: 0 })
  })

  it('blocks requests over limit', () => {
    const rl = createRateLimiter({ limit: 2, windowMs: 60_000 })
    rl.check('key1')
    rl.check('key1')
    const r = rl.check('key1')
    expect(r).toMatchObject({ allowed: false })
    if (!r.allowed) {
      expect(r.retryAfterMs).toBeGreaterThan(0)
    }
  })

  it('isolates keys', () => {
    const rl = createRateLimiter({ limit: 1, windowMs: 60_000 })
    expect(rl.check('a').allowed).toBe(true)
    expect(rl.check('b').allowed).toBe(true)
    expect(rl.check('a').allowed).toBe(false)
  })

  it('recovers after window passes', () => {
    const rl = createRateLimiter({ limit: 1, windowMs: 1_000 })
    expect(rl.check('k').allowed).toBe(true)
    expect(rl.check('k').allowed).toBe(false)

    vi.advanceTimersByTime(1_100)
    expect(rl.check('k').allowed).toBe(true)
  })
})
