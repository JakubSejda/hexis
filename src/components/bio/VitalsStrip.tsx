import Link from 'next/link'
import { Card } from '@/components/ui'

type Props = {
  heightCm: number | null
  age: number | null
  gender: 'male' | 'female' | 'other' | null
  weightKg: number | null
}

const GENDER: Record<NonNullable<Props['gender']>, string> = {
  male: 'muž',
  female: 'žena',
  other: 'jiné',
}

const DASH = '—'

export function VitalsStrip({ heightCm, age, gender, weightKg }: Props) {
  const slots: Array<{ label: string; value: string; empty: boolean }> = [
    {
      label: 'Výška',
      value: heightCm == null ? DASH : `${heightCm} cm`,
      empty: heightCm == null,
    },
    { label: 'Věk', value: age == null ? DASH : `${age} let`, empty: age == null },
    { label: 'Pohlaví', value: gender == null ? DASH : GENDER[gender], empty: gender == null },
    {
      label: 'Hmotnost',
      value: weightKg == null ? DASH : `${weightKg} kg`,
      empty: weightKg == null,
    },
  ]
  const hasEmpty = slots.some((s) => s.empty)

  const grid = (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {slots.map((s) => (
        <Card key={s.label} padding="sm" className={s.empty ? 'opacity-60' : undefined}>
          <div className="text-muted font-mono text-[11px] tracking-[0.2em] uppercase">
            {s.label}
          </div>
          <div className="text-foreground mt-1 font-mono text-lg font-bold">{s.value}</div>
        </Card>
      ))}
    </div>
  )

  if (!hasEmpty) return grid

  return (
    <div className="flex flex-col gap-2">
      {grid}
      <Link href="/settings/profile" className="text-muted hover:text-foreground text-xs">
        Doplň profil →
      </Link>
    </div>
  )
}
