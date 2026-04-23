'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ChevronRight } from 'lucide-react'

type Active = {
  id: number
  planName: string | null
  planSlug: string | null
  startedAt: string
} | null

export function ResumeBanner() {
  const [active, setActive] = useState<Active>(null)
  const [minutes, setMinutes] = useState<number | null>(null)
  useEffect(() => {
    fetch('/api/workout/active')
      .then((r) => r.json())
      .then((d) => setActive(d.active))
  }, [])
  useEffect(() => {
    if (!active) return
    const recompute = () =>
      setMinutes(Math.floor((Date.now() - new Date(active.startedAt).getTime()) / 60000))
    recompute()
    const id = window.setInterval(recompute, 30_000)
    return () => window.clearInterval(id)
  }, [active])
  if (!active || minutes === null) return null
  return (
    <Link
      href={`/workout/${active.id}`}
      className="bg-accent text-background mb-3 flex items-center justify-between rounded-lg px-3 py-2 text-sm font-semibold"
    >
      <span>
        Pokračuj v {active.planName ?? 'tréninku'} · {minutes} min
      </span>
      <ChevronRight size={14} aria-hidden />
    </Link>
  )
}
