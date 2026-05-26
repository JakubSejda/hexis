import Link from 'next/link'

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
        <div
          key={s.label}
          className={`border-border bg-surface rounded-lg border p-3 ${s.empty ? 'opacity-60' : ''}`}
        >
          <div className="text-muted text-[10px] tracking-[0.2em] uppercase">{s.label}</div>
          <div className="text-foreground mt-1 text-lg font-semibold">{s.value}</div>
        </div>
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
