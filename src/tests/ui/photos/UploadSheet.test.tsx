// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ToastProvider } from '@/components/ui'
import { UploadSheet } from '@/components/photos/UploadSheet'

vi.mock('@/components/xp/XpFeedbackProvider', () => ({
  useXpFeedback: () => ({ notifyXp: vi.fn() }),
}))

function open() {
  return render(
    <ToastProvider>
      <UploadSheet open onOpenChange={() => {}} onUploaded={() => {}} />
    </ToastProvider>
  )
}

describe('UploadSheet', () => {
  it('labels the file picker', () => {
    // The only control on the sheet was an unlabelled <input type="file">.
    // Asserted on the input itself: getByLabelText also matches the dialog,
    // which carries aria-labelledby from the sheet title.
    open()
    const input = document.querySelector('input[type="file"]')!
    expect(input).toHaveAccessibleName(/fotk/i)
  })

  it('offers the poses in Czech', () => {
    open()
    expect(screen.getByRole('button', { name: 'Zepředu' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Z boku' })).toBeInTheDocument()
  })
})
