'use client'
import * as DialogPrimitive from '@radix-ui/react-dialog'

/**
 * Raw Radix re-exports only. The composed overlay lives in
 * `primitive/Sheet.tsx` — one responsive component replaced the old
 * `Dialog` + `BottomSheet` pair (WIG audit W3).
 */
export const DialogRoot = DialogPrimitive.Root
export const DialogTrigger = DialogPrimitive.Trigger
export const DialogPortal = DialogPrimitive.Portal
export const DialogOverlay = DialogPrimitive.Overlay
export const DialogContent = DialogPrimitive.Content
export const DialogTitle = DialogPrimitive.Title
export const DialogDescription = DialogPrimitive.Description
export const DialogClose = DialogPrimitive.Close
