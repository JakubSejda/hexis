'use client'
import { Button } from './Button'
import { Sheet } from './Sheet'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  confirmLabel: string
  onConfirm: () => void
  pending?: boolean
}

/**
 * Confirmation for a destructive action, in the app's own surface.
 *
 * Replaces `window.confirm`, which ignores the HUD entirely, cannot say what
 * is about to be deleted in more than one line, and in a standalone PWA looks
 * like the browser interrupting rather than the app asking (WIG audit,
 * finding 32).
 */
export function ConfirmSheet({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  onConfirm,
  pending = false,
}: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title={title} description={description}>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={pending}>
          Zrušit
        </Button>
        <Button variant="danger" onClick={onConfirm} loading={pending}>
          {confirmLabel}
        </Button>
      </div>
    </Sheet>
  )
}
