import { NextResponse, type NextRequest } from 'next/server'
import { authLoginLimiter } from '@/lib/ratelimit'

function originOf(url: string | undefined): string | null {
  if (!url) return null
  try {
    return new URL(url).origin
  } catch {
    return null
  }
}

const SENTRY_ORIGIN = originOf(process.env.NEXT_PUBLIC_SENTRY_DSN)

export function proxy(req: NextRequest) {
  // 1) Rate limit for credentials callback
  if (req.nextUrl.pathname === '/api/auth/callback/credentials' && req.method === 'POST') {
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      req.headers.get('x-real-ip') ??
      'unknown'

    const check = authLoginLimiter.check(ip)
    if (!check.allowed) {
      return new NextResponse(JSON.stringify({ error: 'Too many attempts. Try again later.' }), {
        status: 429,
        headers: {
          'content-type': 'application/json',
          'retry-after': Math.ceil(check.retryAfterMs / 1000).toString(),
        },
      })
    }
  }

  const res = NextResponse.next()

  // 2) Security headers for all responses
  res.headers.set('X-Content-Type-Options', 'nosniff')
  res.headers.set('X-Frame-Options', 'DENY')
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()')

  // HSTS only in production (local dev is HTTP)
  if (process.env.NODE_ENV === 'production') {
    res.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  }

  // CSP. eval only for the dev server's HMR; the Sentry ingest host must be
  // reachable or client-side errors never leave the browser.
  const dev = process.env.NODE_ENV !== 'production'
  res.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "img-src 'self' data: blob:",
      `script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ''}`,
      "style-src 'self' 'unsafe-inline'",
      ['connect-src', "'self'", SENTRY_ORIGIN].filter(Boolean).join(' '),
      "font-src 'self' data:",
      "object-src 'none'",
      "base-uri 'self'",
    ].join('; ')
  )

  return res
}

export const config = {
  // Runs on all routes except static assets
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.svg).*)'],
}
