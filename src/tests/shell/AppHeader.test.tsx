// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AppHeader } from '@/components/shell'

vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
}))

vi.mock('next-auth/react', () => ({
  signOut: vi.fn(),
}))

import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'

describe('AppHeader', () => {
  it('renders the Life Area label for current pathname', () => {
    vi.mocked(usePathname).mockReturnValue('/progress')
    render(<AppHeader streak={5} userName="Jakub" userEmail="j@ex.com" />)
    expect(screen.getByText(/progress/i)).toBeInTheDocument()
  })

  it('renders streak peek when streak > 0', () => {
    vi.mocked(usePathname).mockReturnValue('/dashboard')
    render(<AppHeader streak={7} userName="Jakub" userEmail="j@ex.com" />)
    expect(screen.getByText('7')).toBeInTheDocument()
    expect(screen.getByText(/day streak/i)).toBeInTheDocument()
  })

  it('hides streak peek when streak === 0', () => {
    vi.mocked(usePathname).mockReturnValue('/dashboard')
    render(<AppHeader streak={0} userName="Jakub" userEmail="j@ex.com" />)
    expect(screen.queryByText(/day streak/i)).toBeNull()
  })

  it('opens dropdown with Nutrition, Settings, Sign out on avatar click', async () => {
    vi.mocked(usePathname).mockReturnValue('/dashboard')
    render(<AppHeader streak={3} userName="Jakub" userEmail="j@ex.com" />)
    await userEvent.click(screen.getByRole('button', { name: /open menu/i }))
    expect(await screen.findByRole('menuitem', { name: /nutrition/i })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: /settings/i })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: /sign out/i })).toBeInTheDocument()
  })

  it('calls signOut when Sign out is clicked', async () => {
    vi.mocked(usePathname).mockReturnValue('/dashboard')
    render(<AppHeader streak={3} userName="Jakub" userEmail="j@ex.com" />)
    await userEvent.click(screen.getByRole('button', { name: /open menu/i }))
    await userEvent.click(await screen.findByRole('menuitem', { name: /sign out/i }))
    expect(signOut).toHaveBeenCalled()
  })

  it('uses first letter of userName as avatar fallback', () => {
    vi.mocked(usePathname).mockReturnValue('/dashboard')
    render(<AppHeader streak={3} userName="Jakub Sejda" userEmail="j@ex.com" />)
    expect(screen.getByRole('button', { name: /open menu/i })).toHaveTextContent('J')
  })

  it('falls back to first letter of email when userName is null', () => {
    vi.mocked(usePathname).mockReturnValue('/dashboard')
    render(<AppHeader streak={3} userName={null} userEmail="kuba@ex.com" />)
    expect(screen.getByRole('button', { name: /open menu/i })).toHaveTextContent('K')
  })
})
