// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard'

const push = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}))

beforeEach(() => {
  push.mockClear()
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) }))
})

describe('OnboardingWizard', () => {
  it('renders the welcome step first', () => {
    render(<OnboardingWizard />)
    expect(screen.getByRole('heading', { name: 'Vítej v Hexis' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Pokračovat' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Přeskočit' })).toBeInTheDocument()
  })

  it('Pokračovat advances to profile step, Zpět returns', async () => {
    render(<OnboardingWizard />)
    await userEvent.click(screen.getByRole('button', { name: 'Pokračovat' }))
    expect(screen.getByRole('heading', { name: 'Profil' })).toBeInTheDocument()
    expect(screen.getByLabelText('Jméno')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Zpět' }))
    expect(screen.getByRole('heading', { name: 'Vítej v Hexis' })).toBeInTheDocument()
  })

  it('profile step saves filled fields via PUT /api/user/profile', async () => {
    render(<OnboardingWizard />)
    await userEvent.click(screen.getByRole('button', { name: 'Pokračovat' }))
    await userEvent.type(screen.getByLabelText('Jméno'), 'Jakub')
    await userEvent.click(screen.getByRole('button', { name: 'Pokračovat' }))
    expect(fetch).toHaveBeenCalledWith(
      '/api/user/profile',
      expect.objectContaining({ method: 'PUT', body: JSON.stringify({ name: 'Jakub' }) })
    )
    expect(screen.getByRole('heading', { name: 'Vyber si svůj první quest' })).toBeInTheDocument()
  })

  it('Přeskočit posts /api/user/onboarded and navigates to dashboard', async () => {
    render(<OnboardingWizard />)
    await userEvent.click(screen.getByRole('button', { name: 'Přeskočit' }))
    expect(fetch).toHaveBeenCalledWith('/api/user/onboarded', { method: 'POST' })
    expect(push).toHaveBeenCalledWith('/dashboard')
  })

  it('final step: Otevřít Training completes and routes to /training', async () => {
    render(<OnboardingWizard />)
    await userEvent.click(screen.getByRole('button', { name: 'Pokračovat' }))
    await userEvent.click(screen.getByRole('button', { name: 'Pokračovat' }))
    await userEvent.click(screen.getByRole('button', { name: 'Otevřít Training' }))
    expect(fetch).toHaveBeenCalledWith('/api/user/onboarded', { method: 'POST' })
    expect(push).toHaveBeenCalledWith('/training')
  })
})
