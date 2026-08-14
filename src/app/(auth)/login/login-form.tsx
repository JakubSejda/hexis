'use client'

import { useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Button, Heading, Input } from '@/components/ui'

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
      <div className="mb-6">
        <Heading level={1} className="text-accent text-3xl font-bold tracking-[0.2em]">
          HEXIS
        </Heading>
        <p className="text-muted mt-1 text-sm">Tvoje cesta. Tvoje XP.</p>
      </div>

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

        <Button type="submit" variant="success" size="md" loading={isPending} className="w-full">
          Přihlásit
        </Button>
      </form>
    </>
  )
}
