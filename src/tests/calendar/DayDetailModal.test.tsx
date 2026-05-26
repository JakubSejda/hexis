// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { DayDetailModal } from '@/components/calendar/DayDetailModal'

vi.mock('@/components/photos/Lightbox', () => ({
  Lightbox: ({ photos, initialIndex }: { photos: { takenAt: string }[]; initialIndex: number }) => (
    <div role="dialog" data-testid="lightbox">
      {photos[initialIndex]?.takenAt}
    </div>
  ),
}))

const fetchMock = vi.fn()

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
  fetchMock.mockReset()
})

describe('DayDetailModal', () => {
  it('does not fetch when date is null', () => {
    render(<DayDetailModal date={null} onClose={() => {}} />)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('fetches when date is provided', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          date: '2026-05-15',
          sessions: [],
          habits: [],
          measurement: null,
          photos: [],
        }),
        { status: 200 }
      )
    )
    render(<DayDetailModal date="2026-05-15" onClose={() => {}} />)
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/calendar/day?date=2026-05-15'))
  })

  it('renders Nic se nedělo when all sections are empty', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          date: '2026-05-15',
          sessions: [],
          habits: [],
          measurement: null,
          photos: [],
        }),
        { status: 200 }
      )
    )
    render(<DayDetailModal date="2026-05-15" onClose={() => {}} />)
    await waitFor(() => expect(screen.getByText(/nic se nedělo/i)).toBeInTheDocument())
  })

  it('renders only the truthy sections', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          date: '2026-05-15',
          sessions: [{ id: 1, planName: 'Plán A', durationMin: 90 }],
          habits: [],
          measurement: null,
          photos: [],
        }),
        { status: 200 }
      )
    )
    render(<DayDetailModal date="2026-05-15" onClose={() => {}} />)
    await waitFor(() => expect(screen.getByText(/^training$/i)).toBeInTheDocument())
    expect(screen.queryByText(/^návyky$/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/^vážení$/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/^fotky$/i)).not.toBeInTheDocument()
  })

  it('close button calls onClose', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          date: '2026-05-15',
          sessions: [],
          habits: [],
          measurement: null,
          photos: [],
        }),
        { status: 200 }
      )
    )
    const onClose = vi.fn()
    render(<DayDetailModal date="2026-05-15" onClose={onClose} />)
    await waitFor(() => screen.getByText(/nic se nedělo/i))
    fireEvent.click(screen.getByRole('button', { name: /zavřít/i }))
    expect(onClose).toHaveBeenCalled()
  })
})
