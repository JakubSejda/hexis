'use client'
import { useEffect, useState } from 'react'

function untilMidnight(now: Date): string {
  const end = new Date(now)
  end.setHours(24, 0, 0, 0)
  const s = Math.max(0, Math.floor((end.getTime() - now.getTime()) / 1000))
  const hh = String(Math.floor(s / 3600)).padStart(2, '0')
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0')
  const ss = String(s % 60).padStart(2, '0')
  return `${hh}:${mm}:${ss}`
}

/** Time left in the user's local day; empty until mounted so SSR never disagrees. */
export function MidnightCountdown() {
  const [text, setText] = useState<string | null>(null)
  useEffect(() => {
    const tick = () => setText(untilMidnight(new Date()))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])
  return <span suppressHydrationWarning>{text ?? '--:--:--'}</span>
}
