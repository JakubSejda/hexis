import Link from 'next/link'
import type { Quest } from '@/lib/today-quest'
import { ProgressBar } from '@/components/ui'

function Label() {
  return (
    <div className="text-muted text-xs font-medium tracking-[0.2em] uppercase">
      Today&apos;s Quest
    </div>
  )
}

export function TodayQuest({ quest }: { quest: Quest }) {
  if (quest.kind === 'active') {
    return (
      <Link
        href={`/training/${quest.sessionId}`}
        className="bg-accent/15 hover:bg-accent/25 border-accent/40 block rounded-xl border p-4 shadow-md transition-all hover:shadow-lg"
      >
        <Label />
        <div className="text-foreground mt-1 text-xl font-bold">▶ Pokračuj v {quest.planName}</div>
        <div className="mt-2 flex items-center gap-3 text-xs">
          <span className="text-muted-strong">
            {quest.completed} ze {quest.total} cviků hotovo
          </span>
          <ProgressBar
            value={quest.completed}
            max={Math.max(quest.total, 1)}
            tone="primary"
            height={4}
            className="w-24"
          />
        </div>
      </Link>
    )
  }

  if (quest.kind === 'rest') {
    return (
      <div className="bg-surface-raised border-border rounded-xl border p-4 shadow-md">
        <Label />
        <div className="text-muted mt-1 text-xl font-bold">Rest day</div>
        <div className="text-muted mt-1 text-xs">
          {quest.nextPlanName ? `Dnes regeneruj. Zítra: ${quest.nextPlanName}` : 'Dnes regeneruj.'}
        </div>
      </div>
    )
  }

  if (quest.kind === 'scheduled') {
    return (
      <Link
        href="/training"
        className="bg-accent/15 hover:bg-accent/25 border-accent/40 block rounded-xl border p-4 shadow-md transition-all hover:shadow-lg"
      >
        <Label />
        <div className="text-foreground mt-1 text-xl font-bold">▶ {quest.planName}</div>
        <div className="text-muted mt-1 text-xs">{quest.exerciseCount} cviků</div>
      </Link>
    )
  }

  // no-plan
  return (
    <Link
      href="/training"
      className="bg-accent/15 hover:bg-accent/25 border-accent/40 block rounded-xl border p-4 shadow-md transition-all hover:shadow-lg"
    >
      <Label />
      <div className="text-foreground mt-1 text-xl font-bold">Začni svojí cestu</div>
      <div className="text-muted mt-1 text-xs">Nastav si svůj první plán →</div>
    </Link>
  )
}
