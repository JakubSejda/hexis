import { Card } from '@/components/ui'
import { MuscleHeatmap } from '@/components/heatmap/MuscleHeatmap'

type Props = {
  data: Record<string, number>
  maxVolume: number
}

export function MuscleWidget({ data, maxVolume }: Props) {
  const hasData = Object.keys(data).length > 0
  return (
    <Card>
      <h3 className="text-muted mb-2 text-center font-mono text-xs tracking-[0.2em] uppercase">
        Posledních 7 dní
      </h3>
      {hasData ? (
        <MuscleHeatmap data={data} maxVolume={maxVolume} />
      ) : (
        <p className="text-muted py-4 text-center text-xs">Žádný trénink</p>
      )}
    </Card>
  )
}
