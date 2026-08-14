import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

type Props = {
  ym: string // YYYY-MM (visible month)
  currentYm: string // YYYY-MM (today's month)
}

const FMT = new Intl.DateTimeFormat('cs-CZ', { month: 'long', year: 'numeric' })

function shiftMonth(ym: string, delta: number): string {
  const y = Number(ym.slice(0, 4))
  const m = Number(ym.slice(5, 7))
  const next0 = m - 1 + delta
  const newY = y + Math.floor(next0 / 12)
  const newM0 = ((next0 % 12) + 12) % 12
  return `${newY}-${String(newM0 + 1).padStart(2, '0')}`
}

export function CalendarHeader({ ym, currentYm }: Props) {
  const y = Number(ym.slice(0, 4))
  const m0 = Number(ym.slice(5, 7)) - 1
  const label = FMT.format(new Date(Date.UTC(y, m0, 15)))
  const prev = shiftMonth(ym, -1)
  const next = shiftMonth(ym, +1)
  const onCurrent = ym === currentYm

  return (
    <div className="flex items-center justify-between gap-3">
      <Link
        href={`/calendar?ym=${prev}`}
        aria-label="Předchozí měsíc"
        className="hud-clip-sm bg-surface-raised text-muted hover:text-system flex h-11 w-11 items-center justify-center transition-colors"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden />
      </Link>
      <div className="flex flex-col items-center gap-1">
        <h1 className="text-foreground text-lg font-black tracking-tight uppercase italic">
          {label}
        </h1>
        {!onCurrent && (
          <Link href="/calendar" className="text-muted hover:text-system text-xs">
            Dnes
          </Link>
        )}
      </div>
      <Link
        href={`/calendar?ym=${next}`}
        aria-label="Další měsíc"
        className="hud-clip-sm bg-surface-raised text-muted hover:text-system flex h-11 w-11 items-center justify-center transition-colors"
      >
        <ChevronRight className="h-4 w-4" aria-hidden />
      </Link>
    </div>
  )
}
