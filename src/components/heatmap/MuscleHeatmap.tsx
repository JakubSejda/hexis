'use client'

import { AnatomicalBodyDual } from '@/components/anatomy/AnatomicalBodyDual'
import { volumeToColor } from '@/lib/heatmap-colors'

type Props = {
  data: Record<string, number>
  maxVolume: number
}

export function MuscleHeatmap({ data, maxVolume }: Props) {
  const highlights: Record<string, string> = {}
  for (const [slug, volume] of Object.entries(data)) {
    highlights[slug] = volumeToColor(volume, maxVolume)
  }
  return <AnatomicalBodyDual highlights={highlights} bodyClassName="h-48 w-auto" />
}
