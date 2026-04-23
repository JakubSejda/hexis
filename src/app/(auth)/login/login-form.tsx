'use client'

import { useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Heading, Input } from '@/components/ui'

export default function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') ?? '/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    startTransition(async () => {
      const res = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (res?.error) {
        setError('Neplatný email nebo heslo.')
        return
      }

      router.push(callbackUrl)
      router.refresh()
    })
  }

  return (
    <>
      <Heading level={1} className="mb-6">
        Hexis — Login
      </Heading>

      <form onSubmit={onSubmit} className="space-y-4">
        <Input
          id="email"
          label="Email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isPending}
        />

        <Input
          id="password"
          label="Heslo"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isPending}
        />

        {error && (
          <p className="border-danger/40 bg-danger/10 text-danger rounded border px-3 py-2 text-sm">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="bg-primary text-background hover:bg-primary/90 w-full rounded px-4 py-2 font-medium disabled:opacity-50"
        >
          {isPending ? 'Přihlašuji…' : 'Přihlásit'}
        </button>
      </form>
    </>
  )
}
