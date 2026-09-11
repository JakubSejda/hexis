// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const push = vi.fn()
const refresh = vi.fn()
const signIn = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, refresh }),
  useSearchParams: () => new URLSearchParams(),
}))
vi.mock('next-auth/react', () => ({
  signIn: (...args: unknown[]) => signIn(...args),
}))

import LoginForm from '@/app/(auth)/login/login-form'

beforeEach(() => {
  push.mockReset()
  refresh.mockReset()
  signIn.mockReset()
})

describe('LoginForm', () => {
  it('lets a password manager fill the credentials', () => {
    render(<LoginForm />)
    const email = screen.getByLabelText('Email')
    const password = screen.getByLabelText('Heslo')

    expect(email).toHaveAttribute('autocomplete', 'email')
    expect(email).toHaveAttribute('name', 'email')
    expect(password).toHaveAttribute('autocomplete', 'current-password')
    expect(password).toHaveAttribute('name', 'password')
  })

  it('does not spellcheck the email field', () => {
    render(<LoginForm />)
    expect(screen.getByLabelText('Email')).toHaveAttribute('spellcheck', 'false')
  })

  it('announces a rejected sign-in', async () => {
    signIn.mockResolvedValue({ error: 'CredentialsSignin' })
    render(<LoginForm />)

    await userEvent.type(screen.getByLabelText('Email'), 'a@b.cz')
    await userEvent.type(screen.getByLabelText('Heslo'), 'wrong')
    await userEvent.click(screen.getByRole('button', { name: /přihlásit/i }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Neplatný email nebo heslo.')
    })
  })

  it('sends focus back to the email field when credentials are rejected', async () => {
    signIn.mockResolvedValue({ error: 'CredentialsSignin' })
    render(<LoginForm />)

    await userEvent.type(screen.getByLabelText('Email'), 'a@b.cz')
    await userEvent.type(screen.getByLabelText('Heslo'), 'wrong')
    await userEvent.click(screen.getByRole('button', { name: /přihlásit/i }))

    await waitFor(() => {
      expect(screen.getByLabelText('Email')).toHaveFocus()
    })
  })
})
