/**
 * Client-side Sentry. NEXT_PUBLIC_SENTRY_DSN is inlined AT BUILD TIME —
 * changing it requires an image rebuild (see docs/deploy-runbook.md).
 * Without the DSN this whole file is a no-op.
 */
import * as Sentry from '@sentry/nextjs'

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0,
  })
}

export const onRouterTransitionStart = dsn ? Sentry.captureRouterTransitionStart : () => {}
