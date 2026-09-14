// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ExercisePicker } from '@/components/workout/ExercisePicker'

const fetchMock = vi.fn()

beforeEach(() => {
  fetchMock.mockReset()
  fetchMock.mockResolvedValue(
    new Response(JSON.stringify([{ id: 1, name: 'Bench press', type: 'compound', userId: null }]), {
      status: 200,
    })
  )
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

function open() {
  return render(<ExercisePicker open onOpenChange={() => {}} onPicked={() => {}} />)
}

describe('ExercisePicker', () => {
  it('uses a real ellipsis in the search placeholder', async () => {
    open()
    expect(await screen.findByPlaceholderText('Hledej…')).toBeInTheDocument()
  })

  it('does not refetch the catalogue on every keystroke', async () => {
    const user = userEvent.setup()
    open()
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))

    await user.type(screen.getByPlaceholderText('Hledej…'), 'bench')

    await waitFor(() => expect(fetchMock.mock.calls.at(-1)![0].toString()).toContain('q=bench'), {
      timeout: 2000,
    })
    // Five characters, one search request — plus the initial unfiltered load.
    expect(fetchMock.mock.calls.length).toBeLessThanOrEqual(2)
  })

  it('gives the rows a hover state and lets long lists skip offscreen work', async () => {
    open()
    const row = await screen.findByRole('button', { name: /Bench press/ })
    expect(row.className).toMatch(/hover:/)
    expect(row.closest('li')!.className).toMatch(
      /content-visibility-auto|\[content-visibility:auto\]/
    )
  })
})
