'use client'

import { useEffect, useState } from 'react'
import { Heading, Switch } from '@/components/ui'

const ALL: { key: string; label: string; required?: boolean }[] = [
  { key: 'kcal', label: 'Kalorie', required: true },
  { key: 'protein', label: 'Protein', required: true },
  { key: 'carbs', label: 'Sacharidy' },
  { key: 'fat', label: 'Tuky' },
  { key: 'sugar', label: 'Cukry' },
]

export default function MacrosPage() {
  const [macros, setMacros] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/user/macros')
      .then((r) => r.json())
      .then((data) => {
        setMacros(data.macros)
        setLoading(false)
      })
  }, [])

  async function toggle(key: string) {
    if (key === 'kcal' || key === 'protein') return
    setSaving(true)
    const next = macros.includes(key) ? macros.filter((m) => m !== key) : [...macros, key]
    const res = await fetch('/api/user/macros', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ macros: next }),
    })
    if (res.ok) {
      const data = await res.json()
      setMacros(data.macros)
    }
    setSaving(false)
  }

  if (loading) return <div className="text-muted p-4">Načítání…</div>

  return (
    <div className="space-y-4 p-4">
      <Heading level={1}>Sledovaná makra</Heading>
      <p className="text-muted text-sm">Kalorie a protein jsou vždy zapnuté.</p>
      <ul className="space-y-2">
        {ALL.map((m) => (
          <li
            key={m.key}
            className="border-border bg-surface flex items-center justify-between rounded-lg border p-3"
          >
            <span className="text-foreground">{m.label}</span>
            <Switch
              checked={macros.includes(m.key)}
              disabled={m.required || saving}
              onChange={() => toggle(m.key)}
              label={m.label}
            />
          </li>
        ))}
      </ul>
    </div>
  )
}
