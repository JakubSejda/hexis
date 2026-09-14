'use client'

import { SerwistProvider } from '@serwist/next/react'
import type { ReactNode } from 'react'

/**
 * Client boundary for Serwist's registration provider.
 *
 * `@serwist/next/react` ships **no** `'use client'` directive of its own, so
 * importing it straight into the root layout fails the production build with
 * `createContext is not a function` while collecting page data. This wrapper
 * is the boundary.
 *
 * In configurator mode the CLI builds the worker but registers nothing — this
 * is what keeps the PWA, and the rest-timer notifications in
 * `lib/sw-rest-timer.ts`, alive.
 */
export function ServiceWorkerProvider({ children }: { children: ReactNode }) {
  return (
    <SerwistProvider swUrl="/sw.js" disable={process.env.NODE_ENV === 'development'}>
      {children}
    </SerwistProvider>
  )
}
