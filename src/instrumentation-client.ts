/**
 * Client-side Sentry. NEXT_PUBLIC_SENTRY_DSN is inlined AT BUILD TIME —
 * changing it requires an image rebuild (see docs/deploy-runbook.md).
 * The SDK is imported lazily so a build without the DSN never loads it.
 */
type SentryModule = typeof import('@sentry/nextjs')

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN
let sentry: SentryModule | null = null

if (dsn) {
  void import('@sentry/nextjs').then((mod) => {
    mod.init({ dsn, tracesSampleRate: 0 })
    sentry = mod
  })
}

export function onRouterTransitionStart(
  ...args: Parameters<SentryModule['captureRouterTransitionStart']>
): void {
  sentry?.captureRouterTransitionStart(...args)
}
