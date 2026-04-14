'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'

type Active = {
  id: number
  planName: string | null
  planSlug: string | null
  startedAt: string
} | null

export function ResumeBanner() {
  const [active, setActive] = useState<Active>(null)
  useEffect(() => {
    fetch('/api/workout/active')
      .then((r) => r.json())
      .then((d) => setActive(d.active))
  }, [])
  if (!active) return null
  const minutes = Math.floor((Date.now() - new Date(active.startedAt).getTime()) / 60000)
  return (
    <Link
      href={`/workout/${active.id}`}
      className="mb-3 flex items-center justify-between rounded-lg bg-[#F59E0B] px-3 py-2 text-sm font-semibold text-[#0A0E14]"
    >
      <span>
        Pokračuj v {active.planName ?? 'tréninku'} · {minutes} min
      </span>
      <span>›</span>
    </Link>
  )
}
