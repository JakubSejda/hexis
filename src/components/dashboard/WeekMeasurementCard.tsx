import Link from 'next/link'
import { ArrowDown, ArrowUp } from 'lucide-react'
import { Sparkline } from '@/components/ui'
import { calcDelta, deltaDirection, type Goal } from '@/lib/measurement-delta'

function renderDelta(d: number | null, precision: number) {
  if (d == null) return ''
  const up = d > 0
  const abs = up ? d : Math.abs(d)
  return (
    <>
      {up ? (
        <ArrowUp size={12} aria-hidden className="inline" />
      ) : (
        <ArrowDown size={12} aria-hidden className="inline" />
      )}
      {abs.toFixed(precision)}
    </>
  )
}

type Props = {
  thisWeek: {
    weightKg: number | null
    waistCm: number | null
    chestCm: number | null
    thighCm: number | null
    bicepsCm: number | null
  } | null
  prevWeek: {
    weightKg: number | null
    waistCm: number | null
    chestCm: number | null
    thighCm: number | null
    bicepsCm: number | null
  } | null
  weightSeries: (number | null)[]
}

const COLOR = { good: '#10b981', bad: '#ef4444', neutral: '#6b7280' }
const TONE = { good: 'primary', bad: 'danger', neutral: 'muted' } as const

export function WeekMeasurementCard({ thisWeek, prevWeek, weightSeries }: Props) {
  if (!thisWeek && !prevWeek) {
    return (
      <Card>
        <Header cta="Zadat měření →" />
        <p className="text-muted text-sm">Žádná měření tento týden.</p>
      </Card>
    )
  }
  const weightDelta = calcDelta(thisWeek?.weightKg ?? null, prevWeek?.weightKg ?? null)
  const weightDir = deltaDirection(weightDelta, 'lower-is-good')
  return (
    <Card>
      <Header cta="Měřit →" />
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <div className="text-muted text-[11px]">Váha</div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-foreground text-3xl font-bold">
              {thisWeek?.weightKg?.toFixed(1) ?? '—'}
            </span>
            <span
              className="inline-flex items-center gap-0.5 text-sm font-semibold"
              style={{ color: COLOR[weightDir] }}
            >
              {renderDelta(weightDelta, 1)}
            </span>
          </div>
          <div className="text-muted mt-0.5 text-[11px]">kg</div>
        </div>
        <div className="flex-1">
          <Sparkline
            values={weightSeries}
            width={140}
            height={48}
            tone={TONE[weightDir]}
            className="block"
          />
          <div className="text-muted text-right text-[10px]">8 týdnů</div>
        </div>
      </div>
      <div className="border-border mt-3 grid grid-cols-4 gap-3 border-t pt-3">
        <Mini
          label="Pas"
          actual={thisWeek?.waistCm ?? null}
          prev={prevWeek?.waistCm ?? null}
          goal="lower-is-good"
        />
        <Mini
          label="Hrudník"
          actual={thisWeek?.chestCm ?? null}
          prev={prevWeek?.chestCm ?? null}
          goal="higher-is-good"
        />
        <Mini
          label="Stehno"
          actual={thisWeek?.thighCm ?? null}
          prev={prevWeek?.thighCm ?? null}
          goal="higher-is-good"
        />
        <Mini
          label="Biceps"
          actual={thisWeek?.bicepsCm ?? null}
          prev={prevWeek?.bicepsCm ?? null}
          goal="higher-is-good"
        />
      </div>
    </Card>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-border bg-surface space-y-1 rounded-xl border p-3.5">{children}</div>
  )
}

function Header({ cta }: { cta: string }) {
  return (
    <div className="mb-2 flex items-center justify-between">
      <span className="text-foreground text-sm font-semibold">Tento týden</span>
      <Link href="/progress/body" className="text-primary text-xs">
        {cta}
      </Link>
    </div>
  )
}

function Mini({
  label,
  actual,
  prev,
  goal,
}: {
  label: string
  actual: number | null
  prev: number | null
  goal: Goal
}) {
  const d = calcDelta(actual, prev)
  const dir = deltaDirection(d, goal)
  return (
    <div className="text-center">
      <div className="text-muted text-[11px]">{label}</div>
      <div className="text-foreground text-base font-semibold">{actual?.toFixed(1) ?? '—'}</div>
      <div
        className="inline-flex items-center justify-center gap-0.5 text-[11px]"
        style={{ color: COLOR[dir] }}
      >
        {d == null ? '—' : renderDelta(d, 1)}
      </div>
    </div>
  )
}
