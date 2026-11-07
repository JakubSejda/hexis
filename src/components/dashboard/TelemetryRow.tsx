import Link from 'next/link'
import { Card } from '@/components/ui'
import { czPlural, DAYS } from '@/lib/cz-plural'

/** Three readouts under the quest: streak, spendable XP, this week's sessions. */

type Props = {
  streak: number
  balanceXp: number
  weekDone: number
  weekTarget: number | null
}

const nf = new Intl.NumberFormat('cs-CZ')

function Tile({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <>
      <div className="font-display text-2xl leading-none font-black">
        {value}
        {unit ? <span className="text-muted ml-1 text-xs font-bold">{unit}</span> : null}
      </div>
      <div className="text-muted mt-1.5 text-[10px] font-bold tracking-[0.12em] uppercase">
        {label}
      </div>
    </>
  )
}

export function TelemetryRow({ streak, balanceXp, weekDone, weekTarget }: Props) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <Card padding="sm" className="text-center">
        <Tile label="Série" value={String(streak)} unit={czPlural(streak, DAYS)} />
      </Card>
      <Card
        as={Link}
        href="/rewards"
        variant="interactive"
        padding="sm"
        className="block text-center"
      >
        <Tile label="K utracení" value={nf.format(balanceXp)} unit="XP" />
      </Card>
      <Card padding="sm" className="text-center">
        <Tile label="Týden" value={weekTarget ? `${weekDone}/${weekTarget}` : String(weekDone)} />
      </Card>
    </div>
  )
}
