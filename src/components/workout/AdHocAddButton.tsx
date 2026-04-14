'use client'
import { useState } from 'react'
import { ExercisePicker } from './ExercisePicker'

export function AdHocAddButton({
  onPicked,
}: {
  onPicked: (exerciseId: number, name: string) => void
}) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="h-10 rounded-lg border border-dashed border-[#1F2733] text-sm text-[#6B7280]"
      >
        + Přidat cvik
      </button>
      <ExercisePicker
        open={open}
        onOpenChange={setOpen}
        onPicked={(id, name) => {
          setOpen(false)
          onPicked(id, name)
        }}
      />
    </>
  )
}
