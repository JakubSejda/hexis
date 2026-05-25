import Link from 'next/link'
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
      <Link
        href="/settings/profile"
        className="border-border bg-surface text-muted hover:border-accent flex items-center justify-between rounded-lg border p-4 transition-colors"
      >
        <span>Nastav si svůj cíl</span>
        <span aria-hidden>→</span>
      </Link>
    )
  }

  const progress = goalProgress(startedWeightKg, currentWeightKg, goalKg)
  const percent = Math.round(progress * 100)

  return (
    <div className="border-border bg-surface rounded-lg border p-4">
      {goalText && <div className="text-foreground text-base">{goalText}</div>}
      <div className="text-foreground mt-1 text-2xl font-bold">→ {goalKg} kg</div>
      <div className="mt-3">
        <div
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          className="bg-surface-raised relative h-2 w-full overflow-hidden rounded"
        >
          <div className="bg-accent h-full" style={{ width: `${percent}%` }} />
        </div>
        <div className="text-muted mt-1 flex justify-between text-xs">
          <span>{startedWeightKg ?? '—'} kg</span>
          <span>{goalKg} kg</span>
        </div>
      </div>
    </div>
  )
}
