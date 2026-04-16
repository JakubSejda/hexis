'use client'

import { BodySvg } from './BodySvg'
import { volumeToColor, slugToZones } from '@/lib/heatmap-colors'

type Props = {
  data: Record<string, number>
  maxVolume: number
}

export function MuscleHeatmap({ data, maxVolume }: Props) {
  const frontFills: Record<string, string> = {}
  const backFills: Record<string, string> = {}

  for (const [slug, volume] of Object.entries(data)) {
    const color = volumeToColor(volume, maxVolume)
    const zones = slugToZones(slug)
    for (const { zone, view } of zones) {
      const target = view === 'front' ? frontFills : backFills
      if (!target[zone]) target[zone] = color
    }
  }

  return (
    <div className="flex items-center justify-center gap-2">
      <div className="flex flex-col items-center">
        <BodySvg view="front" fills={frontFills} className="h-48 w-auto" />
        <span className="mt-1 text-[10px] text-[#6b7280]">Zepředu</span>
      </div>
      <div className="flex flex-col items-center">
        <BodySvg view="back" fills={backFills} className="h-48 w-auto" />
        <span className="mt-1 text-[10px] text-[#6b7280]">Zezadu</span>
      </div>
    </div>
  )
}
