import Link from 'next/link'
import { Card } from '@/components/ui'

/** HUD telemetry row (Reforge R2): three mono readouts under the quest plate. */

type Props = {
  streak: number
  balanceXp: number
  weekDone: number
  weekTarget: number | null
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <>
      <div className="text-muted font-mono text-[11px] tracking-[0.2em] uppercase">{label}</div>
      <div className="text-foreground mt-1 font-mono text-lg font-bold">{value}</div>
    </>
  )
}

export function TelemetryRow({ streak, balanceXp, weekDone, weekTarget }: Props) {
  return (
    <div className="animate-hud-power-on grid grid-cols-3 gap-2">
      <Card padding="sm" className="text-center">
        <Tile label="Streak" value={`${streak}d`} />
      </Card>
      <Card
        as={Link}
        href="/rewards"
        variant="interactive"
        padding="sm"
        className="block text-center"
      >
        <Tile label="K utracení" value={`${balanceXp} XP`} />
      </Card>
      <Card padding="sm" className="text-center">
        <Tile label="Týden" value={weekTarget ? `${weekDone}/${weekTarget}` : String(weekDone)} />
      </Card>
    </div>
  )
}
