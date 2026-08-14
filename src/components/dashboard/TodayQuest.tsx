import Link from 'next/link'
import type { Quest } from '@/lib/today-quest'
import { Card, ProgressBar } from '@/components/ui'

/**
 * The screen's single amber plate (HUD grammar: one call-to-action per
 * screen). Corner brackets mark it as the active objective.
 */

function Label() {
  return (
    <div className="text-accent font-mono text-xs font-medium tracking-[0.2em] uppercase">
      Dnešní quest
    </div>
  )
}

function Brackets() {
  return (
    <>
      <span
        aria-hidden
        className="border-accent absolute -top-2.5 -left-2.5 h-3 w-3 border-t-2 border-l-2"
      />
      <span
        aria-hidden
        className="border-accent absolute -right-2.5 -bottom-2.5 h-3 w-3 border-r-2 border-b-2"
      />
    </>
  )
}

function CtaTag({ children }: { children: string }) {
  return (
    <span className="hud-clip-sm bg-accent text-background mt-3 inline-flex h-9 items-center px-4 text-sm font-semibold tracking-[0.12em] uppercase">
      {children}
    </span>
  )
}

export function TodayQuest({ quest }: { quest: Quest }) {
  if (quest.kind === 'active') {
    return (
      <Card
        as={Link}
        href={`/training/${quest.sessionId}`}
        edge="accent"
        variant="interactive"
        className="animate-hud-power-on block"
      >
        <div className="relative">
          <Brackets />
          <Label />
          <div className="text-foreground mt-1 text-xl font-bold">
            ▸ Pokračuj v {quest.planName}
          </div>
          <div className="mt-2 flex items-center gap-3 text-xs">
            <span className="text-muted-strong font-mono">
              {quest.completed} ze {quest.total} cviků hotovo
            </span>
            <ProgressBar
              value={quest.completed}
              max={Math.max(quest.total, 1)}
              tone="warn"
              height={4}
              className="w-24"
            />
          </div>
        </div>
      </Card>
    )
  }

  if (quest.kind === 'rest') {
    return (
      <Card className="animate-hud-power-on">
        <Label />
        <div className="text-muted mt-1 text-xl font-bold">Rest day</div>
        <div className="text-muted mt-1 text-xs">
          {quest.nextPlanName ? `Dnes regeneruj. Zítra: ${quest.nextPlanName}` : 'Dnes regeneruj.'}
        </div>
      </Card>
    )
  }

  if (quest.kind === 'scheduled') {
    return (
      <Card
        as={Link}
        href="/training"
        edge="accent"
        variant="interactive"
        className="animate-hud-power-on block"
      >
        <div className="relative">
          <Brackets />
          <Label />
          <div className="text-foreground mt-1 text-xl font-bold">{quest.planName}</div>
          <div className="text-muted mt-1 font-mono text-xs">{quest.exerciseCount} cviků</div>
          <CtaTag>Začít quest ▸</CtaTag>
        </div>
      </Card>
    )
  }

  // no-plan
  return (
    <Card
      as={Link}
      href="/training"
      edge="accent"
      variant="interactive"
      className="animate-hud-power-on block"
    >
      <div className="relative">
        <Brackets />
        <Label />
        <div className="text-foreground mt-1 text-xl font-bold">Začni svojí cestu</div>
        <div className="text-muted mt-1 text-xs">Nastav si svůj první plán</div>
        <CtaTag>Začít quest ▸</CtaTag>
      </div>
    </Card>
  )
}
