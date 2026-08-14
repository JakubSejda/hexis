import Link from 'next/link'
import { Card } from '@/components/ui'
import { goalProgress } from '@/lib/bio-goal-progress'

type Props = {
  goalKg: number | null
  goalText: string | null
  currentWeightKg: number | null
  startedWeightKg: number | null
}

export function GoalCard({ goalKg, goalText, currentWeightKg, startedWeightKg }: Props) {
  if (goalKg === null) {
    return (
      <Card as={Link} href="/settings/profile" variant="interactive" className="block">
        <div className="text-muted flex items-center justify-between">
          <span>Nastav si svůj cíl</span>
          <span aria-hidden>→</span>
        </div>
      </Card>
    )
  }

  const progress = goalProgress(startedWeightKg, currentWeightKg, goalKg)
  const percent = Math.round(progress * 100)

  return (
    <Card>
      {goalText && <div className="text-foreground text-base">{goalText}</div>}
      <div className="text-foreground mt-1 font-mono text-2xl font-bold">→ {goalKg} kg</div>
      <div className="mt-3">
        <div
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          className="bg-surface-raised relative h-2 w-full overflow-hidden"
        >
          <div className="bg-accent h-full" style={{ width: `${percent}%` }} />
        </div>
        <div className="text-muted mt-1 flex justify-between font-mono text-xs">
          <span>{startedWeightKg ?? '—'} kg</span>
          <span>{goalKg} kg</span>
        </div>
      </div>
    </Card>
  )
}
