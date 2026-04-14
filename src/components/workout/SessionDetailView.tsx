'use client'
import { useState } from 'react'
import { SetRow } from './SetRow'
import { EditSetSheet } from './EditSetSheet'
import { useRouter } from 'next/navigation'

type ExerciseBlock = {
  exerciseId: number
  name: string
  sets: Array<{
    id: number
    setIndex: number
    weightKg: string | null
    reps: number | null
    rpe: number | null
  }>
}

export function SessionDetailView({
  sessionId,
  exercises,
  editMode,
}: {
  sessionId: number
  exercises: ExerciseBlock[]
  editMode: boolean
}) {
  const router = useRouter()
  const [editId, setEditId] = useState<number | null>(null)

  const toggleEdit = () => {
    const params = new URLSearchParams(window.location.search)
    if (editMode) params.delete('edit')
    else params.set('edit', '1')
    router.replace(`?${params.toString()}`)
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <button type="button" onClick={toggleEdit} className="self-end text-xs text-[#10B981]">
        {editMode ? 'Hotovo' : 'Upravit'}
      </button>
      {exercises.map((ex) => (
        <div key={ex.exerciseId} className="flex flex-col gap-1">
          <h3 className="text-sm font-semibold">{ex.name}</h3>
          {ex.sets.map((s) => (
            <SetRow key={s.id} set={s} onTap={editMode ? () => setEditId(s.id) : undefined} />
          ))}
        </div>
      ))}
      {editId !== null ? (
        <EditSetSheet
          sessionId={sessionId}
          setId={editId}
          onClose={() => setEditId(null)}
          onChanged={() => {
            setEditId(null)
            router.refresh()
          }}
        />
      ) : null}
    </div>
  )
}
