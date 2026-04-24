import type { ReactNode } from 'react'
import { Sparkline, ProgressBar } from '@/components/ui'
import { levelToTierMeta } from '@/lib/tiers'
import { ChevronUp } from 'lucide-react'

export type LifeAreaInput = {
  value: string
  secondary: string
  visual: ReactNode
  empty: boolean
}

function formatKcal(n: number): string {
  return new Intl.NumberFormat('cs-CZ').format(Math.round(n))
}

function formatDelta(kg: number): string {
  const sign = kg > 0 ? '+' : kg < 0 ? '−' : ''
  return `${sign}${Math.abs(kg).toFixed(1)} kg`
}

export function resolveTrainingCard(sessionDates: Date[], now: Date = new Date()): LifeAreaInput {
  const sevenDaysAgo = new Date(now)
  sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 7)
  const thirtyDaysAgo = new Date(now)
  thirtyDaysAgo.setUTCDate(thirtyDaysAgo.getUTCDate() - 30)
  const thisWeek = sessionDates.filter((d) => d >= sevenDaysAgo).length
  const inThirty = sessionDates.some((d) => d >= thirtyDaysAgo)

  if (!inThirty) {
    return {
      value: 'Žádné tréninky',
      secondary: 'Začni',
      visual: null,
      empty: true,
    }
  }

  // 8-week count series for sparkline
  const weeks: number[] = []
  for (let w = 7; w >= 0; w--) {
    const end = new Date(now)
    end.setUTCDate(end.getUTCDate() - w * 7)
    const start = new Date(end)
    start.setUTCDate(start.getUTCDate() - 7)
    weeks.push(sessionDates.filter((d) => d > start && d <= end).length)
  }

  return {
    value: `${thisWeek} sessions`,
    secondary: 'this week',
    visual: <Sparkline values={weeks} tone="primary" width={120} height={32} />,
    empty: false,
  }
}

export function resolveNutritionCard(
  today: { kcalActual: number | null; targetKcal: number | null } | null,
  thisWeek: { targetKcal: number | null } | null
): LifeAreaInput {
  const kcal = today?.kcalActual ?? null
  const target = today?.targetKcal ?? thisWeek?.targetKcal ?? null

  if (kcal == null && target == null) {
    return {
      value: 'Nelogováno',
      secondary: 'Přidej',
      visual: null,
      empty: true,
    }
  }

  const value = kcal != null ? `${formatKcal(kcal)} kcal` : '—'
  const secondary = target != null ? `of ${formatKcal(target)}` : 'no target'
  return {
    value,
    secondary,
    visual: <ProgressBar value={kcal} max={target} tone="primary" height={6} />,
    empty: false,
  }
}

export function resolveProgressCard(weightSeries: (number | null)[]): LifeAreaInput {
  const nonNull = weightSeries.filter((v): v is number => v != null)
  if (nonNull.length === 0) {
    return {
      value: 'Bez měření',
      secondary: 'Zvaž se',
      visual: null,
      empty: true,
    }
  }
  if (nonNull.length === 1) {
    return {
      value: '—',
      secondary: 'last week',
      visual: <Sparkline values={weightSeries} tone="muted" width={120} height={32} />,
      empty: false,
    }
  }
  const last = nonNull[nonNull.length - 1]!
  const prev = nonNull[nonNull.length - 2]!
  const delta = last - prev
  return {
    value: formatDelta(delta),
    secondary: 'last week',
    visual: (
      <Sparkline
        values={weightSeries}
        tone={delta < 0 ? 'success' : delta > 0 ? 'warn' : 'muted'}
        width={120}
        height={32}
      />
    ),
    empty: false,
  }
}

export function resolveStatsCard(level: number, totalXp: number): LifeAreaInput {
  if (level === 1 && totalXp < 50) {
    return {
      value: 'Nová postava',
      secondary: 'L1',
      visual: null,
      empty: true,
    }
  }
  const meta = levelToTierMeta(level)
  const tierIndex = meta.tier
  return {
    value: `Level ${level}`,
    secondary: meta.name,
    visual: (
      <div className="flex gap-1" aria-hidden>
        {[1, 2, 3, 4, 5].map((i) => (
          <ChevronUp
            key={i}
            size={14}
            style={{ color: i <= tierIndex ? meta.color : 'var(--color-border)' }}
          />
        ))}
      </div>
    ),
    empty: false,
  }
}
