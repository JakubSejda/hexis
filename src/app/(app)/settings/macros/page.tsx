'use client'

import { useEffect, useState } from 'react'
import { Switch } from '@/components/ui/Switch'

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

  if (loading) return <div className="p-4 text-[#6b7280]">Načítání…</div>

  return (
    <div className="space-y-4 p-4">
      <h1 className="text-xl font-semibold">Sledovaná makra</h1>
      <p className="text-sm text-[#6b7280]">Kalorie a protein jsou vždy zapnuté.</p>
      <ul className="space-y-2">
        {ALL.map((m) => (
          <li
            key={m.key}
            className="flex items-center justify-between rounded-lg border border-[#1f2733] bg-[#141a22] p-3"
          >
            <span className="text-[#e5e7eb]">{m.label}</span>
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
