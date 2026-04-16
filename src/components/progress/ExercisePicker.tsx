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
    return <p className="text-sm text-[#6b7280]">Žádné cviky s daty</p>
  }
  return (
    <select
      value={value ?? ''}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full rounded-lg border border-[#1f2733] bg-[#141a22] px-3 py-2 text-sm text-[#e5e7eb] outline-none focus:border-[#10b981]"
    >
      {exercises.map((ex) => (
        <option key={ex.id} value={ex.id}>
          {ex.name}
        </option>
      ))}
    </select>
  )
}
