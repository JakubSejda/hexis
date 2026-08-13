'use client'
import { useState } from 'react'
import { Button } from '@/components/ui'
import { ExercisePicker } from './ExercisePicker'

export function AdHocAddButton({
  onPicked,
}: {
  onPicked: (exerciseId: number, name: string) => void
}) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button variant="dashed" size="md" className="w-full" onClick={() => setOpen(true)}>
        + Přidat cvik
      </Button>
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
