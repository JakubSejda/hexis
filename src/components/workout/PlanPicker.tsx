'use client'
import { useRouter } from 'next/navigation'
import { ArrowRight, Plus } from 'lucide-react'
import { useState } from 'react'
import { Card, Heading, Pill } from '@/components/ui'

type Plan = { id: number; slug: string; name: string; order: number; exerciseCount?: number }

function split(name: string): { title: string; sub: string | null } {
  const [title, ...rest] = name.split(' — ')
  return { title: title ?? name, sub: rest.length ? rest.join(' — ') : null }
}

function describe(p: Plan): string {
  return [split(p.name).sub, p.exerciseCount ? `${p.exerciseCount} cviků` : null]
    .filter(Boolean)
    .join(' · ')
}

export function PlanPicker({
  plans,
  recommendedId,
}: {
  plans: Plan[]
  recommendedId: number | null
}) {
  const router = useRouter()
  const [starting, setStarting] = useState<number | 'adhoc' | null>(null)
  const start = async (planId: number | null) => {
    setStarting(planId ?? 'adhoc')
    const res = await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ planId }),
    })
    if (res.status === 409) {
      const body = await res.json()
      router.push(`/training/${body.activeSessionId}`)
      return
    }
    const body = await res.json()
    router.push(`/training/${body.id}`)
  }

  const recommended = plans.find((p) => p.id === recommendedId) ?? null
  const others = plans.filter((p) => p.id !== recommendedId)

  return (
    <div className="flex flex-col gap-3">
      {recommended ? (
        <Card padding="lg" edge="accent" className="relative overflow-hidden">
          <span
            aria-hidden
            className="from-accent-deep to-accent absolute inset-x-0 top-0 h-1 bg-linear-to-r"
          />
          <Pill variant="accent" size="md">
            Doporučeno na dnes
          </Pill>
          <Heading level={2} className="mt-3 text-3xl">
            {split(recommended.name).title}
          </Heading>
          <p className="text-muted mt-2 text-sm">{describe(recommended)}</p>
          <button
            type="button"
            disabled={starting !== null}
            onClick={() => start(recommended.id)}
            className="bg-accent text-accent-foreground shadow-glow font-display mt-4 flex h-14 w-full items-center justify-between rounded-full px-6 text-base font-black uppercase transition-transform active:scale-[0.98] disabled:opacity-60"
          >
            {starting === recommended.id ? 'Startuji…' : 'Začít quest'}
            <ArrowRight className="size-5" aria-hidden />
          </button>
        </Card>
      ) : null}
      {others.map((p) => (
        <Card
          key={p.id}
          as="button"
          type="button"
          variant="interactive"
          disabled={starting !== null}
          onClick={() => start(p.id)}
          className="flex w-full items-center gap-3 text-left"
        >
          <span className="rounded-control bg-surface-raised text-system font-display grid size-11 shrink-0 place-items-center text-sm font-black">
            {p.slug}
          </span>
          <span className="flex-1">
            <span className="font-display block text-base font-black uppercase">
              {split(p.name).title}
            </span>
            <span className="text-muted block text-xs">{describe(p)}</span>
          </span>
          <ArrowRight className="text-muted size-4" aria-hidden />
        </Card>
      ))}
      <button
        type="button"
        disabled={starting !== null}
        onClick={() => start(null)}
        className="rounded-card border-border text-muted hover:text-foreground flex h-14 items-center justify-center gap-2 border border-dashed text-sm font-semibold transition-colors"
      >
        <Plus className="size-4" aria-hidden />
        Volný trénink bez plánu
      </button>
    </div>
  )
}
