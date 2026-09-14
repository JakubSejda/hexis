// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const replace = vi.fn()
let params = new URLSearchParams()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace, push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => '/progress/photos',
  useSearchParams: () => params,
}))

vi.mock('@/components/xp/XpFeedbackProvider', () => ({
  useXpFeedback: () => ({ notifyXp: vi.fn() }),
}))

import { ToastProvider } from '@/components/ui'
import { PhotosPageClient } from '@/components/photos/PhotosPageClient'
import { BeforeAfter } from '@/components/photos/BeforeAfter'

const photo = (id: number, takenAt: string, pose = 'front') => ({
  id,
  takenAt,
  weekStart: null,
  pose,
  thumbUrl: `/t/${id}.jpg`,
  fullUrl: `/f/${id}.jpg`,
  widthPx: 100,
  heightPx: 100,
  note: null,
  createdAt: takenAt,
})

beforeEach(() => {
  replace.mockReset()
  params = new URLSearchParams()
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) =>
      url.toString().includes('/dates')
        ? new Response(JSON.stringify({ dates: ['2026-05-01', '2026-04-01'] }), { status: 200 })
        : new Response(JSON.stringify({ items: [photo(1, '2026-05-01')] }), { status: 200 })
    )
  )
})

describe('photos view mode', () => {
  it('opens the view named in the URL', async () => {
    params = new URLSearchParams('view=timeline')
    render(
      <ToastProvider>
        <PhotosPageClient />
      </ToastProvider>
    )
    await waitFor(() =>
      expect(screen.getByRole('tab', { name: /časová osa/i })).toHaveAttribute(
        'aria-selected',
        'true'
      )
    )
  })

  it('puts the picked view in the URL so the tab survives a reload or a shared link', async () => {
    const user = userEvent.setup()
    render(
      <ToastProvider>
        <PhotosPageClient />
      </ToastProvider>
    )
    await user.click(await screen.findByRole('tab', { name: /časová osa/i }))
    expect(replace).toHaveBeenCalledWith(expect.stringContaining('view=timeline'), {
      scroll: false,
    })
  })
})

describe('before/after pose filter', () => {
  it('starts from the pose named in the URL', () => {
    params = new URLSearchParams('pose=side')
    render(
      <BeforeAfter photos={[photo(1, '2026-05-01', 'side')]} dates={['2026-05-01', '2026-04-01']} />
    )
    expect(screen.getByRole('button', { name: 'Z boku' }).className).toMatch(/bg-system/)
  })

  it('puts the picked pose in the URL', async () => {
    const user = userEvent.setup()
    render(<BeforeAfter photos={[photo(1, '2026-05-01')]} dates={['2026-05-01', '2026-04-01']} />)
    await user.click(screen.getByRole('button', { name: 'Zezadu' }))
    expect(replace).toHaveBeenCalledWith(expect.stringContaining('pose=back'), { scroll: false })
  })
})
