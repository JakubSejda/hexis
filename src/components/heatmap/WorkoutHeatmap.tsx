'use client'

import { AnatomicalBodyDual } from '@/components/anatomy/AnatomicalBodyDual'
import { WORKOUT_COLORS } from '@/lib/heatmap-colors'

type Props = {
  plannedMuscles: string[]
  doneMuscles: string[]
}

export function WorkoutHeatmap({ plannedMuscles, doneMuscles }: Props) {
  const doneSet = new Set(doneMuscles)
  const highlights: Record<string, string> = {}
  for (const slug of new Set([...plannedMuscles, ...doneMuscles])) {
    highlights[slug] = doneSet.has(slug) ? WORKOUT_COLORS.done : WORKOUT_COLORS.planned
  }
  return <AnatomicalBodyDual highlights={highlights} bodyClassName="h-36 w-auto" />
}
