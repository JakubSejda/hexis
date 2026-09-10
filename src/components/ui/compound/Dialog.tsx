'use client'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import type { ReactNode } from 'react'

type DialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children?: ReactNode
  dismissible?: boolean
}

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  dismissible = true,
}: DialogProps) {
  const blockDismiss = !dismissible
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="data-[state=open]:animate-in data-[state=open]:fade-in-0 fixed inset-0 z-40 bg-black/50" />
        <DialogPrimitive.Content
          className="hud-clip bg-border text-foreground fixed top-1/2 left-1/2 z-50 w-[min(92vw,420px)] -translate-x-1/2 -translate-y-1/2 p-px shadow-xl focus:outline-none"
          onEscapeKeyDown={(e) => {
            if (blockDismiss) e.preventDefault()
          }}
          onPointerDownOutside={(e) => {
            if (blockDismiss) e.preventDefault()
          }}
        >
          {/* Inner surface layer — the outer element is the 1px edge-light (see Card). */}
          <div className="hud-clip bg-surface h-full w-full p-4">
            <DialogPrimitive.Title className="font-mono text-xs tracking-[0.2em] uppercase">
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

export const DialogRoot = DialogPrimitive.Root
export const DialogTrigger = DialogPrimitive.Trigger
export const DialogPortal = DialogPrimitive.Portal
export const DialogOverlay = DialogPrimitive.Overlay
export const DialogContent = DialogPrimitive.Content
export const DialogTitle = DialogPrimitive.Title
export const DialogDescription = DialogPrimitive.Description
export const DialogClose = DialogPrimitive.Close
