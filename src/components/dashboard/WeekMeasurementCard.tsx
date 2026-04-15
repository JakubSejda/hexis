import Link from 'next/link'
import { Sparkline } from '@/components/ui/Sparkline'
import { calcDelta, deltaDirection, type Goal } from '@/lib/measurement-delta'

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

export function WeekMeasurementCard({ thisWeek, prevWeek, weightSeries }: Props) {
  if (!thisWeek && !prevWeek) {
    return (
      <Card>
        <Header cta="Zadat měření →" />
        <p className="text-sm text-[#6b7280]">Žádná měření tento týden.</p>
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
          <div className="text-[11px] text-[#6b7280]">Váha</div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-bold text-[#e5e7eb]">
              {thisWeek?.weightKg?.toFixed(1) ?? '—'}
            </span>
            <span className="text-sm font-semibold" style={{ color: COLOR[weightDir] }}>
              {weightDelta == null
                ? ''
                : weightDelta > 0
                  ? `↑ ${weightDelta.toFixed(1)}`
                  : `↓ ${Math.abs(weightDelta).toFixed(1)}`}
            </span>
          </div>
          <div className="mt-0.5 text-[11px] text-[#6b7280]">kg</div>
        </div>
        <div className="flex-1">
          <Sparkline
            values={weightSeries}
            width={140}
            height={48}
            color={COLOR[weightDir]}
            className="block"
          />
          <div className="text-right text-[10px] text-[#6b7280]">8 týdnů</div>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-4 gap-3 border-t border-[#1f2733] pt-3">
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
    <div className="space-y-1 rounded-xl border border-[#1f2733] bg-[#141a22] p-3.5">
      {children}
    </div>
  )
}

function Header({ cta }: { cta: string }) {
  return (
    <div className="mb-2 flex items-center justify-between">
      <span className="text-sm font-semibold text-[#e5e7eb]">Tento týden</span>
      <Link href="/progress/body" className="text-xs text-[#10b981]">
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
      <div className="text-[11px] text-[#6b7280]">{label}</div>
      <div className="text-base font-semibold text-[#e5e7eb]">{actual?.toFixed(1) ?? '—'}</div>
      <div className="text-[11px]" style={{ color: COLOR[dir] }}>
        {d == null ? '—' : d > 0 ? `↑ ${d.toFixed(1)}` : `↓ ${Math.abs(d).toFixed(1)}`}
      </div>
    </div>
  )
}
