'use client'

import { BodySvg } from './BodySvg'
import { slugToZones, WORKOUT_COLORS } from '@/lib/heatmap-colors'

type Props = {
  plannedMuscles: string[]
  doneMuscles: string[]
}

export function WorkoutHeatmap({ plannedMuscles, doneMuscles }: Props) {
  const doneSet = new Set(doneMuscles)
  const frontFills: Record<string, string> = {}
  const backFills: Record<string, string> = {}

  const allSlugs = new Set([...plannedMuscles, ...doneMuscles])
  for (const slug of allSlugs) {
    const color = doneSet.has(slug) ? WORKOUT_COLORS.done : WORKOUT_COLORS.planned
    const zones = slugToZones(slug)
    for (const { zone, view } of zones) {
      const target = view === 'front' ? frontFills : backFills
      if (target[zone] === WORKOUT_COLORS.done) continue
      target[zone] = color
    }
  }

  return (
    <div className="flex items-center justify-center gap-2">
      <BodySvg view="front" fills={frontFills} className="h-36 w-auto" />
      <BodySvg view="back" fills={backFills} className="h-36 w-auto" />
    </div>
  )
}
