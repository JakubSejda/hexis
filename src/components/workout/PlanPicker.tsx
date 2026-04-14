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
      router.push(`/workout/${body.activeSessionId}`)
      return
    }
    const body = await res.json()
    router.push(`/workout/${body.id}`)
  }
  return (
    <div className="flex flex-col gap-2">
      {plans.map((p) => (
        <button
          key={p.id}
          type="button"
          onClick={() => start(p.id)}
          className={`flex items-center justify-between rounded-lg border p-3 text-left ${
            p.id === recommendedId ? 'border-[#10B981]' : 'border-[#1F2733]'
          }`}
        >
          <span>
            <strong>{p.name}</strong>{' '}
            {p.id === recommendedId ? (
              <span className="ml-2 rounded-full bg-[#1F2733] px-2 py-0.5 text-xs text-[#10B981]">
                doporučeno
              </span>
            ) : null}
          </span>
          <span className="text-xs text-[#6B7280]">{p.slug}</span>
        </button>
      ))}
      <button
        type="button"
        onClick={() => start(null)}
        className="rounded-lg border border-dashed border-[#1F2733] p-3 text-sm text-[#6B7280]"
      >
        + Ad-hoc trénink
      </button>
    </div>
  )
}
