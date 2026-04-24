import Link from 'next/link'
import { ProgressBar } from '@/components/ui'
import { classifyDay, classifyMacro } from '@/lib/nutrition-classify'

type Props = {
  today: {
    kcalActual: number | null
    proteinG: number | null
    carbsG: number | null
    fatG: number | null
    sugarG: number | null
  } | null
  targets: {
    targetKcal: number | null
    targetProteinG: number | null
    targetCarbsG: number | null
    targetFatG: number | null
    targetSugarG: number | null
  } | null
  trackedMacros: string[]
}

export function TodayNutritionCard({ today, targets, trackedMacros }: Props) {
  if (!today && !targets) {
    return (
      <Card>
        <Header label="Dnešní výživa" cta="Zalogovat →" />
        <p className="text-muted text-sm">Zatím žádná data pro dnešek.</p>
      </Card>
    )
  }
  const kcal = classifyDay({
    kcalActual: today?.kcalActual ?? null,
    targetKcal: targets?.targetKcal ?? null,
  })
  const protein = classifyMacro({
    actual: today?.proteinG ?? null,
    target: targets?.targetProteinG ?? null,
  })
  return (
    <Card>
      <Header label="Dnešní výživa" cta="Upravit →" />
      <Stat
        label="Kalorie"
        actual={today?.kcalActual ?? null}
        target={targets?.targetKcal ?? null}
        unit="kcal"
        tone={kcal === 'hit' ? 'success' : kcal === 'miss' ? 'danger' : 'muted'}
        height={10}
      />
      <Stat
        label="Protein"
        actual={today?.proteinG ?? null}
        target={targets?.targetProteinG ?? null}
        unit="g"
        tone={
          protein === 'hit'
            ? 'success'
            : protein === 'miss'
              ? 'danger'
              : protein === 'near'
                ? 'warn'
                : 'muted'
        }
        height={6}
      />
      {(trackedMacros.includes('carbs') || trackedMacros.includes('fat')) && (
        <div className="grid grid-cols-2 gap-2">
          {trackedMacros.includes('carbs') && (
            <Mini
              label="Sacharidy"
              actual={today?.carbsG ?? null}
              target={targets?.targetCarbsG ?? null}
              unit="g"
            />
          )}
          {trackedMacros.includes('fat') && (
            <Mini
              label="Tuky"
              actual={today?.fatG ?? null}
              target={targets?.targetFatG ?? null}
              unit="g"
            />
          )}
        </div>
      )}
    </Card>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-border bg-surface space-y-2.5 rounded-xl border p-3.5">{children}</div>
  )
}

function Header({ label, cta }: { label: string; cta: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-foreground text-sm font-semibold">{label}</span>
      <Link href="/nutrition" className="text-primary text-xs">
        {cta}
      </Link>
    </div>
  )
}

function Stat({
  label,
  actual,
  target,
  unit,
  tone,
  height,
}: {
  label: string
  actual: number | null
  target: number | null
  unit: string
  tone: 'success' | 'danger' | 'warn' | 'muted'
  height: number
}) {
  return (
    <div>
      <div className="mb-1 flex justify-between">
        <span className="text-muted text-xs">{label}</span>
        <span className="text-foreground text-xs font-semibold">
          {actual ?? '—'} / {target ?? '—'} {unit}
        </span>
      </div>
      <ProgressBar value={actual} max={target} tone={tone} height={height} />
    </div>
  )
}

function Mini({
  label,
  actual,
  target,
  unit,
}: {
  label: string
  actual: number | null
  target: number | null
  unit: string
}) {
  return (
    <div>
      <div className="mb-0.5 flex justify-between">
        <span className="text-muted text-[11px]">{label}</span>
        <span className="text-muted text-[11px]">
          {actual ?? '—'} {unit}
        </span>
      </div>
      <ProgressBar value={actual} max={target} tone="muted" height={4} />
    </div>
  )
}
