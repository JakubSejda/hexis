import { Card, Heading } from '@/components/ui'
import { MuscleHeatmap } from '@/components/heatmap/MuscleHeatmap'

type Props = {
  data: Record<string, number>
  maxVolume: number
}

export function MuscleWidget({ data, maxVolume }: Props) {
  const hasData = Object.keys(data).length > 0
  return (
    <Card>
      <Heading level={3} variant="region" className="mb-2 text-center">
        Posledních 7 dní
      </Heading>
      {hasData ? (
        <MuscleHeatmap data={data} maxVolume={maxVolume} />
      ) : (
        <p className="text-muted py-4 text-center text-xs">Žádný trénink</p>
      )}
    </Card>
  )
}
