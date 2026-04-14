'use client'
import * as Dialog from '@radix-ui/react-dialog'

type Props = {
  open: boolean
  onOpenChange: (v: boolean) => void
  title?: string
  children: React.ReactNode
}

export function BottomSheet({ open, onOpenChange, title, children }: Props) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="data-[state=open]:animate-in data-[state=open]:fade-in-0 fixed inset-0 z-40 bg-black/50" />
        <Dialog.Content className="data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom fixed right-0 bottom-0 left-0 z-50 rounded-t-2xl border-t border-[#1F2733] bg-[#141A22] p-4 pb-8 text-[#E5E7EB] focus:outline-none">
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-[#1F2733]" />
          {title ? (
            <Dialog.Title className="mb-3 text-base font-semibold">{title}</Dialog.Title>
          ) : null}
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
