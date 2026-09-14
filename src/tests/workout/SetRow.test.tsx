// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SetRow } from '@/components/workout/SetRow'

const set = { id: 1, setIndex: 0, weightKg: 82.5, reps: 8, rpe: 8 }

describe('SetRow', () => {
  it('shows it is tappable — a row that opens an editor needs a hover state', () => {
    render(<SetRow set={set} onTap={vi.fn()} />)
    expect(screen.getByRole('button').className).toMatch(/hover:/)
  })
})
