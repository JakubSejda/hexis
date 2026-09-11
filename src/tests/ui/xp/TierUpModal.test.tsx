// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TierUpModal } from '@/components/xp/TierUpModal'

describe('TierUpModal confetti', () => {
  it('hides the decorative confetti from assistive tech', () => {
    render(<TierUpModal levelAfter={16} tier={3} onDismiss={() => {}} />)
    const layer = screen.getByTestId('confetti')
    expect(layer).toHaveAttribute('aria-hidden', 'true')
  })

  it('marks every piece so reduced motion can stop it', () => {
    // The animation is an inline style (per-piece duration and delay), so the
    // reduced-motion rule needs a class hook to override it.
    render(<TierUpModal levelAfter={16} tier={3} onDismiss={() => {}} />)
    const pieces = screen.getByTestId('confetti').children
    expect(pieces.length).toBeGreaterThan(0)
    for (const piece of pieces) {
      expect(piece).toHaveClass('hud-confetti')
    }
  })
})
