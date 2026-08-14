/**
 * Server-side observability (Sentry). Entirely disabled unless
 * NEXT_PUBLIC_SENTRY_DSN is set — local dev, CI and tests run without it.
 * No sourcemap upload for the beta (minified stacks are acceptable);
 * that keeps next.config free of the withSentryConfig wrapper.
 */
import type { Instrumentation } from 'next'

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN

export async function register() {
  if (!dsn) return
  const Sentry = await import('@sentry/nextjs')
  Sentry.init({
    dsn,
    tracesSampleRate: 0,
    enableLogs: false,
  })
}

export const onRequestError: Instrumentation.onRequestError = async (...args) => {
  if (!dsn) return
  const Sentry = await import('@sentry/nextjs')
  await Sentry.captureRequestError(...args)
}
