import { MuscleHeatmap } from '@/components/heatmap/MuscleHeatmap'

type Props = {
  data: Record<string, number>
  maxVolume: number
}

export function MuscleWidget({ data, maxVolume }: Props) {
  const hasData = Object.keys(data).length > 0
  return (
    <div className="rounded-lg border border-[#1F2733] p-3">
      <h3 className="mb-2 text-center text-xs text-[#6B7280]">Posledních 7 dní</h3>
      {hasData ? (
        <MuscleHeatmap data={data} maxVolume={maxVolume} />
      ) : (
        <p className="py-4 text-center text-xs text-[#6b7280]">Žádný trénink</p>
      )}
    </div>
  )
}
