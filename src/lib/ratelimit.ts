type RateLimitOptions = {
  limit: number
  windowMs: number
}

type CheckResult = { allowed: true; remaining: number } | { allowed: false; retryAfterMs: number }

/**
 * In-memory sliding-window rate limiter.
 * Suitable for Phase 1 single-instance. Phase 2+ → Redis.
 */
export function createRateLimiter(opts: RateLimitOptions) {
  const buckets = new Map<string, number[]>()

  function check(key: string): CheckResult {
    const now = Date.now()
    const cutoff = now - opts.windowMs

    const bucket = buckets.get(key) ?? []
    // Drop older timestamps
    const fresh = bucket.filter((t) => t > cutoff)

    if (fresh.length >= opts.limit) {
      const oldest = fresh[0]!
      return {
        allowed: false,
        retryAfterMs: oldest + opts.windowMs - now,
      }
    }

    fresh.push(now)
    buckets.set(key, fresh)
    return { allowed: true, remaining: opts.limit - fresh.length }
  }

  function reset(key: string) {
    buckets.delete(key)
  }

  return { check, reset }
}

/**
 * Preset limiters for various endpoints.
 * Phase 1 single-instance → state lost on restart (OK for auth).
 */
export const authLoginLimiter = createRateLimiter({
  limit: 5,
  windowMs: 15 * 60_000, // 15 minutes
})
