'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
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
  const emailRef = useRef<HTMLInputElement>(null)

  // Focus moves to the first field at fault after a failed submit. It waits
  // for the transition to settle: the inputs carry `disabled={isPending}`, and
  // a disabled input cannot take focus — calling focus() any earlier is a
  // silent no-op that leaves the caret on the submit button.
  useEffect(() => {
    if (error && !isPending) emailRef.current?.focus()
  }, [error, isPending])

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
          ref={emailRef}
          id="email"
          name="email"
          label="Email"
          type="email"
          autoComplete="email"
          spellCheck={false}
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isPending}
        />

        <Input
          id="password"
          name="password"
          label="Heslo"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isPending}
        />

        {error && (
          <p
            role="alert"
            className="border-danger/40 bg-danger/10 text-danger border px-3 py-2 text-sm"
          >
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
