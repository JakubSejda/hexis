'use client'

import { Select } from '@/components/ui'

type Exercise = {
  id: number
  name: string
}

type Props = {
  exercises: Exercise[]
  value: number | null
  onChange: (id: number) => void
}

export function ExercisePicker({ exercises, value, onChange }: Props) {
  if (exercises.length === 0) {
    return <p className="text-muted text-sm">Žádné cviky s daty</p>
  }
  return (
    <Select value={value ?? ''} onChange={(e) => onChange(Number(e.target.value))}>
      {exercises.map((ex) => (
        <option key={ex.id} value={ex.id}>
          {ex.name}
        </option>
      ))}
    </Select>
  )
}
