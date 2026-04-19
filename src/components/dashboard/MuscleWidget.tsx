import { MuscleHeatmap } from '@/components/heatmap/MuscleHeatmap'

type Props = {
  data: Record<string, number>
  maxVolume: number
}

export function MuscleWidget({ data, maxVolume }: Props) {
  const hasData = Object.keys(data).length > 0
  return (
    <div className="border-border rounded-lg border p-3">
      <h3 className="text-muted mb-2 text-center text-xs">Posledních 7 dní</h3>
      {hasData ? (
        <MuscleHeatmap data={data} maxVolume={maxVolume} />
      ) : (
        <p className="text-muted py-4 text-center text-xs">Žádný trénink</p>
      )}
    </div>
  )
}
