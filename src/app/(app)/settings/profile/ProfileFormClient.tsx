'use client'

import { useState } from 'react'

export type ProfileInitial = {
  name: string | null
  birthDate: string | null
  gender: 'male' | 'female' | 'other' | null
  heightCm: number | null
  goalKg: number | null
  goalText: string | null
  startedAt: string | null
}

type FormState = {
  name: string
  birthDate: string
  gender: '' | 'male' | 'female' | 'other'
  heightCm: string
  goalKg: string
  goalText: string
  startedAt: string
}

function initialToForm(p: ProfileInitial): FormState {
  return {
    name: p.name ?? '',
    birthDate: p.birthDate ?? '',
    gender: p.gender ?? '',
    heightCm: p.heightCm == null ? '' : String(p.heightCm),
    goalKg: p.goalKg == null ? '' : String(p.goalKg),
    goalText: p.goalText ?? '',
    startedAt: p.startedAt ?? '',
  }
}

function formToBody(f: FormState) {
  return {
    name: f.name.trim() === '' ? null : f.name.trim(),
    birthDate: f.birthDate === '' ? null : f.birthDate,
    gender: f.gender === '' ? null : f.gender,
    heightCm: f.heightCm === '' ? null : Number(f.heightCm),
    goalKg: f.goalKg === '' ? null : Number(f.goalKg),
    goalText: f.goalText === '' ? null : f.goalText,
    startedAt: f.startedAt === '' ? null : f.startedAt,
  }
}

type Issue = { path: (string | number)[]; message: string }

export function ProfileFormClient({ initial }: { initial: ProfileInitial }) {
  const [form, setForm] = useState<FormState>(() => initialToForm(initial))
  const [issues, setIssues] = useState<Issue[]>([])
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<number | null>(null)

  function update<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm((s) => ({ ...s, [k]: v }))
  }

  function err(field: string): string | null {
    return issues.find((i) => i.path?.[0] === field)?.message ?? null
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setIssues([])
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(formToBody(form)),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        if (Array.isArray(data?.issues)) setIssues(data.issues as Issue[])
        return
      }
      setSavedAt(Date.now())
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <Field label="Jméno" htmlFor="name" error={err('name')}>
        <input
          id="name"
          type="text"
          maxLength={100}
          value={form.name}
          onChange={(e) => update('name', e.target.value)}
          className="border-border bg-surface text-foreground rounded-md border px-3 py-2"
        />
      </Field>

      <Field label="Datum narození" htmlFor="birthDate" error={err('birthDate')}>
        <input
          id="birthDate"
          type="date"
          min="1900-01-01"
          value={form.birthDate}
          onChange={(e) => update('birthDate', e.target.value)}
          className="border-border bg-surface text-foreground rounded-md border px-3 py-2"
        />
      </Field>

      <Field label="Pohlaví" htmlFor="gender" error={err('gender')}>
        <select
          id="gender"
          value={form.gender}
          onChange={(e) => update('gender', e.target.value as FormState['gender'])}
          className="border-border bg-surface text-foreground rounded-md border px-3 py-2"
        >
          <option value="">—</option>
          <option value="male">muž</option>
          <option value="female">žena</option>
          <option value="other">jiné</option>
        </select>
      </Field>

      <Field label="Výška (cm)" htmlFor="heightCm" error={err('heightCm')}>
        <input
          id="heightCm"
          type="number"
          inputMode="numeric"
          min={50}
          max={250}
          step={1}
          value={form.heightCm}
          onChange={(e) => update('heightCm', e.target.value)}
          className="border-border bg-surface text-foreground rounded-md border px-3 py-2"
        />
      </Field>

      <Field label="Cíl (kg)" htmlFor="goalKg" error={err('goalKg')}>
        <input
          id="goalKg"
          type="number"
          inputMode="decimal"
          min={30}
          max={300}
          step={0.1}
          value={form.goalKg}
          onChange={(e) => update('goalKg', e.target.value)}
          className="border-border bg-surface text-foreground rounded-md border px-3 py-2"
        />
      </Field>

      <Field label="Cíl (text)" htmlFor="goalText" error={err('goalText')}>
        <input
          id="goalText"
          type="text"
          maxLength={120}
          value={form.goalText}
          onChange={(e) => update('goalText', e.target.value)}
          className="border-border bg-surface text-foreground rounded-md border px-3 py-2"
        />
      </Field>

      <Field label="Datum startu" htmlFor="startedAt" error={err('startedAt')}>
        <input
          id="startedAt"
          type="date"
          value={form.startedAt}
          onChange={(e) => update('startedAt', e.target.value)}
          className="border-border bg-surface text-foreground rounded-md border px-3 py-2"
        />
      </Field>

      <div className="flex items-center justify-between">
        <button
          type="submit"
          disabled={saving}
          className="bg-accent text-background hover:bg-accent/90 rounded-md px-4 py-2 font-semibold disabled:opacity-50"
        >
          {saving ? 'Ukládám…' : 'Uložit'}
        </button>
        {savedAt !== null && <span className="text-muted text-xs">Uloženo</span>}
      </div>
    </form>
  )
}

function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string
  htmlFor: string
  error: string | null
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={htmlFor} className="text-muted text-xs tracking-[0.2em] uppercase">
        {label}
      </label>
      {children}
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  )
}
