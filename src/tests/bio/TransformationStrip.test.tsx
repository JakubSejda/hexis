// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TransformationStrip } from '@/components/bio/TransformationStrip'

vi.mock('@/components/photos/Lightbox', () => ({
  Lightbox: ({ initialIndex, photos }: { initialIndex: number; photos: { takenAt: string }[] }) => (
    <div role="dialog" data-testid="lightbox">
      lightbox open: {photos[initialIndex]?.takenAt}
    </div>
  ),
}))

const photo = (id: number, takenAt: string, weightKg: number | null = null) => ({
  id,
  takenAt,
  pose: 'front' as const,
  fullUrl: `/p/full-${id}.jpg`,
  thumbUrl: `/p/thumb-${id}.jpg`,
  weightKg,
})

describe('TransformationStrip', () => {
  it('renders empty CTA when photos is empty', () => {
    render(<TransformationStrip photos={[]} />)
    const link = screen.getByRole('link', { name: /přidej fotku/i })
    expect(link).toHaveAttribute('href', '/progress')
  })

  it('renders Day 1 hero when exactly one photo', () => {
    render(<TransformationStrip photos={[photo(1, '2026-05-07')]} />)
    expect(screen.getByText(/Day 1/i)).toBeInTheDocument()
    expect(screen.queryByText(/^THEN$/)).not.toBeInTheDocument()
  })

  it('renders Then/Now hero when 2+ photos', () => {
    render(
      <TransformationStrip photos={[photo(1, '2024-06-01', 90), photo(2, '2026-05-07', 78)]} />
    )
    expect(screen.getByText(/then/i)).toBeInTheDocument()
    expect(screen.getByText(/now/i)).toBeInTheDocument()
    expect(screen.getByText(/90 kg/)).toBeInTheDocument()
    expect(screen.getByText(/78 kg/)).toBeInTheDocument()
  })

  it('renders horizontal strip thumbnails for all photos', () => {
    render(
      <TransformationStrip
        photos={[photo(1, '2024-06-01'), photo(2, '2025-01-01'), photo(3, '2026-05-07')]}
      />
    )
    const thumbs = screen.getAllByRole('button', { name: /open photo/i })
    expect(thumbs.length).toBe(3)
  })

  it('opens lightbox at correct index when a strip thumb is clicked', () => {
    render(
      <TransformationStrip
        photos={[photo(1, '2024-06-01'), photo(2, '2025-01-01'), photo(3, '2026-05-07')]}
      />
    )
    const thumbs = screen.getAllByRole('button', { name: /open photo/i })
    fireEvent.click(thumbs[1]!)
    expect(screen.getByTestId('lightbox')).toHaveTextContent('2025-01-01')
  })
})
