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
      href={`/training/${active.id}`}
      className="rounded-card bg-accent text-accent-foreground shadow-glow flex items-center justify-between px-4 py-3.5 text-sm font-semibold"
    >
      <span>
        Quest probíhá: {active.planName?.split(' — ')[0] ?? 'trénink'} · {minutes} min
      </span>
      <ChevronRight size={14} aria-hidden />
    </Link>
  )
}
