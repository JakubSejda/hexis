'use client'
import { useRouter } from 'next/navigation'

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
              <span className="bg-border text-primary ml-2 rounded-full px-2 py-0.5 text-xs">
                doporučeno
              </span>
            ) : null}
          </span>
          <span className="text-muted text-xs">{p.slug}</span>
        </button>
      ))}
      <button
        type="button"
        onClick={() => start(null)}
        className="border-border text-muted rounded-lg border border-dashed p-3 text-sm"
      >
        + Ad-hoc trénink
      </button>
    </div>
  )
}
