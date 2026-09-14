'use client'
import { useEffect, useRef } from 'react'

/**
 * Autofocus the first field of an overlay — on desktop only.
 *
 * On a phone, focusing a field raises the software keyboard over the sheet the
 * user has not read yet, so the guideline is "autoFocus sparingly, desktop
 * only". The check runs in an effect rather than as an `autoFocus` prop: the
 * viewport is unknown while rendering on the server.
 */
export function useDesktopAutoFocus<T extends HTMLElement>(open: boolean) {
  const ref = useRef<T>(null)

  useEffect(() => {
    if (!open) return
    // No matchMedia (older WebViews, non-browser test envs) means we cannot
    // tell — and the mobile-first default is to leave focus alone.
    if (!window.matchMedia?.('(min-width: 48rem)').matches) return
    ref.current?.focus()
  }, [open])

  return ref
}
