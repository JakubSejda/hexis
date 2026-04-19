'use client'

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
    <select
      value={value ?? ''}
      onChange={(e) => onChange(Number(e.target.value))}
      className="border-border bg-surface text-foreground focus:border-primary w-full rounded-lg border px-3 py-2 text-sm outline-none"
    >
      {exercises.map((ex) => (
        <option key={ex.id} value={ex.id}>
          {ex.name}
        </option>
      ))}
    </select>
  )
}
