// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ProfileFormClient } from '@/app/(app)/settings/profile/ProfileFormClient'

const okFetch = vi.fn(async () => new Response(JSON.stringify({ profile: {} }), { status: 200 }))

beforeEach(() => {
  vi.stubGlobal('fetch', okFetch)
  okFetch.mockClear()
})

describe('ProfileFormClient', () => {
  it('renders all 7 form inputs prefilled from initial', () => {
    render(
      <ProfileFormClient
        initial={{
          name: 'Jakub',
          birthDate: '1990-01-15',
          gender: 'male',
          heightCm: 180,
          goalKg: 78.5,
          goalText: 'Cut',
          startedAt: '2024-06-01',
        }}
      />
    )
    expect((screen.getByLabelText(/jméno/i) as HTMLInputElement).value).toBe('Jakub')
    expect((screen.getByLabelText(/datum narození/i) as HTMLInputElement).value).toBe('1990-01-15')
    expect((screen.getByLabelText(/výška/i) as HTMLInputElement).value).toBe('180')
    expect((screen.getByLabelText(/cíl \(kg\)/i) as HTMLInputElement).value).toBe('78.5')
    expect((screen.getByLabelText(/cíl \(text\)/i) as HTMLInputElement).value).toBe('Cut')
  })

  it('PUTs JSON to /api/user/profile on submit', async () => {
    render(
      <ProfileFormClient
        initial={{
          name: null,
          birthDate: null,
          gender: null,
          heightCm: null,
          goalKg: null,
          goalText: null,
          startedAt: null,
        }}
      />
    )
    fireEvent.change(screen.getByLabelText(/jméno/i), { target: { value: 'Jakub' } })
    fireEvent.change(screen.getByLabelText(/výška/i), { target: { value: '180' } })
    fireEvent.click(screen.getByRole('button', { name: /uložit/i }))
    await waitFor(() => expect(okFetch).toHaveBeenCalledTimes(1))
    const [url, init] = okFetch.mock.calls[0]! as unknown as [string, RequestInit]
    expect(url).toBe('/api/user/profile')
    expect(init.method).toBe('PUT')
    const body = JSON.parse(init.body as string)
    expect(body.name).toBe('Jakub')
    expect(body.heightCm).toBe(180)
  })

  it('sends null when an input is cleared', async () => {
    render(
      <ProfileFormClient
        initial={{
          name: 'Jakub',
          birthDate: null,
          gender: null,
          heightCm: 180,
          goalKg: null,
          goalText: null,
          startedAt: null,
        }}
      />
    )
    fireEvent.change(screen.getByLabelText(/výška/i), { target: { value: '' } })
    fireEvent.click(screen.getByRole('button', { name: /uložit/i }))
    await waitFor(() => expect(okFetch).toHaveBeenCalled())
    const [, init] = okFetch.mock.calls[0]! as unknown as [string, RequestInit]
    const body = JSON.parse(init.body as string)
    expect(body.heightCm).toBeNull()
  })

  it('shows server validation error', async () => {
    okFetch.mockImplementationOnce(
      async () =>
        new Response(
          JSON.stringify({
            error: 'Invalid body',
            issues: [{ path: ['heightCm'], message: 'too small' }],
          }),
          { status: 400 }
        )
    )
    render(
      <ProfileFormClient
        initial={{
          name: 'Jakub',
          birthDate: null,
          gender: null,
          heightCm: 180,
          goalKg: null,
          goalText: null,
          startedAt: null,
        }}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /uložit/i }))
    await waitFor(() => expect(screen.getByText(/too small/i)).toBeInTheDocument())
  })
})
