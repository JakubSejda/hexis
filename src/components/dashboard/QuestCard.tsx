import Link from 'next/link'
import { ArrowRight, Moon, TriangleAlert } from 'lucide-react'
import type { Quest } from '@/lib/today-quest'
import type { QuestObjective } from '@/lib/queries/dashboard-sessions'
import { XP_DELTAS } from '@/lib/xp-events'
import { Card, Heading, Pill, cn } from '@/components/ui'
import { czPlural, DAYS } from '@/lib/cz-plural'
import { MidnightCountdown } from './MidnightCountdown'

const VISIBLE = 4

/** "Upper A — Silový" → title "Upper A", subtitle "Silový". */
function splitPlanName(name: string): { title: string; sub: string | null } {
  const [title, ...rest] = name.split(' — ')
  return { title: title ?? name, sub: rest.length ? rest.join(' — ') : null }
}

function CtaLink({ href, children }: { href: string; children: string }) {
  return (
    <Link
      href={href}
      className="bg-accent text-accent-foreground shadow-glow font-display mt-4 flex h-14 items-center justify-between rounded-full px-6 text-base font-black uppercase transition-transform active:scale-[0.98]"
    >
      {children}
      <ArrowRight className="size-5" aria-hidden />
    </Link>
  )
}

function Objectives({ items }: { items: QuestObjective[] }) {
  const visible = items.slice(0, VISIBLE)
  const more = items.length - visible.length
  return (
    <>
      <ul className="mt-4 grid gap-1.5">
        {visible.map((o) => {
          const done = o.doneSets >= o.targetSets
          return (
            <li
              key={o.exerciseId}
              data-done={done || undefined}
              className={cn(
                'rounded-control flex items-center gap-3 px-3 py-2.5',
                done ? 'bg-success/10' : 'bg-surface-raised'
              )}
            >
              <span
                aria-hidden
                className={cn(
                  'rounded-tick grid size-6 shrink-0 place-items-center border-2',
                  done ? 'border-success bg-success text-background' : 'border-border'
                )}
              >
                {done ? '✓' : null}
              </span>
              <span
                className={cn('flex-1 text-sm font-semibold', done && 'text-muted line-through')}
              >
                {o.name}
              </span>
              <span
                className={cn(
                  'font-display text-sm font-black',
                  done ? 'text-success' : 'text-accent'
                )}
              >
                {Math.min(o.doneSets, o.targetSets)}/{o.targetSets}
              </span>
            </li>
          )
        })}
      </ul>
      {more > 0 ? (
        <p className="text-muted mt-2 px-1 text-xs">
          + {more} {more === 1 ? 'další cvik' : more < 5 ? 'další cviky' : 'dalších cviků'}
        </p>
      ) : null}
    </>
  )
}

function Footer() {
  return (
    <div className="mt-3 grid grid-cols-2 gap-2">
      <div className="rounded-control bg-surface-raised px-3 py-2.5">
        <div className="text-muted text-[10px] font-bold tracking-[0.12em] uppercase">Odměna</div>
        <div className="font-display text-reward text-lg font-black">
          +{XP_DELTAS.session_complete} XP
        </div>
      </div>
      <div className="rounded-control bg-surface-raised px-3 py-2.5">
        <div className="text-muted text-[10px] font-bold tracking-[0.12em] uppercase">Zbývá</div>
        <div className="font-display text-lg font-black">
          <MidnightCountdown />
        </div>
      </div>
    </div>
  )
}

type Props = { quest: Quest; objectives: QuestObjective[]; streak: number }

/** The day's main quest — the hub's one call to action. */
export function QuestCard({ quest, objectives, streak }: Props) {
  if (quest.kind === 'rest') {
    return (
      <Card padding="lg" className="animate-hud-power-on">
        <Pill variant="neutral" size="md">
          <Moon className="size-3.5" aria-hidden /> Den regenerace
        </Pill>
        <Heading level={2} className="mt-3 text-2xl">
          Quest splněn
        </Heading>
        <p className="text-muted mt-2 text-sm">
          {quest.nextPlanName
            ? `Dnes regeneruj. Zítra na tebe čeká ${quest.nextPlanName}.`
            : 'Dnes regeneruj.'}
        </p>
      </Card>
    )
  }

  if (quest.kind === 'no-plan') {
    return (
      <Card padding="lg" edge="accent" className="animate-hud-power-on">
        <Pill variant="accent" size="md">
          Denní quest
        </Pill>
        <Heading level={2} className="mt-3 text-3xl">
          První výprava
        </Heading>
        <p className="text-muted mt-2 text-sm">
          Vyber si tréninkový plán a Systém ti z něj bude každý den skládat quest.
        </p>
        <CtaLink href="/training">Vybrat plán</CtaLink>
      </Card>
    )
  }

  const { title, sub } = splitPlanName(quest.planName)
  const active = quest.kind === 'active'
  const total = active ? quest.total : quest.exerciseCount
  const completed = active ? quest.completed : 0

  return (
    <Card padding="lg" className="animate-hud-power-on relative overflow-hidden">
      <span
        aria-hidden
        className="from-accent-deep to-accent absolute inset-x-0 top-0 h-1 bg-linear-to-r"
      />
      <div className="flex items-center justify-between">
        <Pill variant="accent" size="md">
          {active ? 'Quest probíhá' : 'Denní quest'}
        </Pill>
        <Pill variant="neutral" size="md">
          {completed} / {total} cviků
        </Pill>
      </div>
      <Heading level={2} className="mt-3 text-3xl">
        {title}
      </Heading>
      {sub ? <p className="text-muted mt-2 text-sm">{sub}</p> : null}
      {objectives.length > 0 ? <Objectives items={objectives} /> : null}
      <Footer />
      {!active && streak > 0 ? (
        <p className="rounded-control bg-danger/10 text-muted-strong mt-2 flex items-start gap-2.5 px-3 py-2.5 text-xs leading-relaxed">
          <TriangleAlert className="text-danger mt-px size-4 shrink-0" aria-hidden />
          Bez tréninku dnes se tvoje série {streak} {czPlural(streak, DAYS)} přeruší.
        </p>
      ) : null}
      <CtaLink href={active ? `/training/${quest.sessionId}` : '/training'}>
        {active ? 'Pokračovat' : 'Přijmout quest'}
      </CtaLink>
    </Card>
  )
}
