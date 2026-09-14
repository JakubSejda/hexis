'use client'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import type { ReactNode } from 'react'

/**
 * The app's single overlay surface, replacing the old `BottomSheet` + `Dialog`
 * pair (WIG audit W3). They had no rule between them — `EditSetSheet` imported
 * both — and `BottomSheet` was the one shared primitive that never got the HUD
 * grammar.
 *
 * Under md it docks to the bottom edge where the thumb is; from md up it is the
 * same centred two-layer plate as `Card`. Geometry lives in `.hud-sheet`, not in
 * a JS breakpoint, so the server and client agree on first paint.
 */
type SheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children?: ReactNode
  dismissible?: boolean
}

export function Sheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  dismissible = true,
}: SheetProps) {
  const blockDismiss = !dismissible
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="data-[state=open]:animate-in data-[state=open]:fade-in-0 fixed inset-0 z-40 bg-black/50" />
        <DialogPrimitive.Content
          className="hud-sheet bg-border text-foreground focus-visible:ring-ring data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-bottom fixed inset-x-0 bottom-0 z-50 overscroll-contain p-px shadow-xl focus-visible:ring-2 focus-visible:outline-none md:inset-x-auto md:top-1/2 md:bottom-auto md:left-1/2 md:w-[min(92vw,420px)] md:-translate-x-1/2 md:-translate-y-1/2"
          onOpenAutoFocus={(e) => {
            // Radix focuses the first field on open, which raises the software
            // keyboard over a sheet the user has not read yet. Call sites that
            // want focus on desktop opt in with `useDesktopAutoFocus`.
            e.preventDefault()
          }}
          onEscapeKeyDown={(e) => {
            if (blockDismiss) e.preventDefault()
          }}
          onPointerDownOutside={(e) => {
            if (blockDismiss) e.preventDefault()
          }}
        >
          {/* Inner surface layer — the outer element is the 1px edge-light (see Card). */}
          <div className="hud-sheet bg-surface relative h-full w-full p-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:pb-4">
            <div
              data-testid="sheet-grabber"
              aria-hidden="true"
              className="bg-border mx-auto mb-3 h-1 w-10 rounded-full md:hidden"
            />
            {dismissible && (
              <DialogPrimitive.Close
                aria-label="Zavřít"
                className="text-muted hover:text-foreground focus-visible:ring-ring absolute top-4 right-4 flex h-8 w-8 items-center justify-center focus-visible:ring-2 focus-visible:outline-none"
              >
                <X className="h-5 w-5" aria-hidden />
              </DialogPrimitive.Close>
            )}
            <DialogPrimitive.Title className="pr-10 font-mono text-xs tracking-[0.2em] uppercase">
              {title}
            </DialogPrimitive.Title>
            {description && (
              <DialogPrimitive.Description className="text-muted mt-1 text-sm">
                {description}
              </DialogPrimitive.Description>
            )}
            {children && <div className="mt-4">{children}</div>}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
