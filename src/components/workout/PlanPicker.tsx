'use client'
import { useRouter } from 'next/navigation'
import { Button, Pill } from '@/components/ui'

type Plan = { id: number; slug: string; name: string; order: number }

export function PlanPicker({
  plans,
  recommendedId,
}: {
  plans: Plan[]
  recommendedId: number | null
}) {
  const router = useRouter()
  const start = async (planId: number | null) => {
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
  return (
    <div className="flex flex-col gap-2">
      {plans.map((p) => (
        <button
          key={p.id}
          type="button"
          onClick={() => start(p.id)}
          className={`flex items-center justify-between rounded-lg border p-3 text-left ${
            p.id === recommendedId ? 'border-primary' : 'border-border'
          }`}
        >
          <span>
            <strong>{p.name}</strong>{' '}
            {p.id === recommendedId ? (
              <Pill variant="neutral" size="sm" className="text-primary ml-2">
                doporučeno
              </Pill>
            ) : null}
          </span>
          <span className="text-muted text-xs">{p.slug}</span>
        </button>
      ))}
      <Button variant="dashed" size="lg" className="w-full" onClick={() => start(null)}>
        + Ad-hoc trénink
      </Button>
    </div>
  )
}
