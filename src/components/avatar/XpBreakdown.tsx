import { DataTable, type DataTableColumn } from '@/components/ui'
import type { XpHistory } from '@/lib/queries/xp-history'

const LABELS: Record<string, string> = {
  session_complete: 'Dokončené tréninky',
  set_logged: 'Série zalogované',
  measurement_added: 'Měření',
  photo_uploaded: 'Fotky',
  nutrition_logged: 'Výživa',
  pr_achieved: 'PR překonán',
  streak_day: 'Streak',
}

type Row = { event: string; xp: number; count: number }

type Props = { byEventTotal: XpHistory['byEventTotal']; total: number }

export function XpBreakdown({ byEventTotal, total }: Props) {
  const rows: Row[] = Object.entries(byEventTotal)
    .map(([event, v]) => ({ event, xp: v!.xp, count: v!.count }))
    .sort((a, b) => b.xp - a.xp)

  const columns: DataTableColumn<Row>[] = [
    {
      key: 'event',
      render: (r) => LABELS[r.event] ?? r.event,
      cellClassName: 'text-foreground py-2',
    },
    {
      key: 'count',
      align: 'right',
      render: (r) => `${r.count}×`,
      cellClassName: 'text-muted py-2',
    },
    {
      key: 'xp',
      align: 'right',
      render: (r) => `${r.xp.toLocaleString('cs-CZ')} XP`,
      cellClassName: 'text-foreground py-2 font-semibold',
    },
    {
      key: 'percent',
      align: 'right',
      render: (r) => `${total > 0 ? Math.round((r.xp / total) * 100) : 0}%`,
      cellClassName: 'text-muted py-2 pl-3 text-xs',
    },
  ]

  return (
    <div className="border-border bg-surface rounded-lg border p-4">
      <h2 className="text-foreground mb-3 text-sm font-semibold">Rozpis podle aktivity</h2>
      <DataTable
        columns={columns}
        data={rows}
        getRowKey={(r) => r.event}
        empty={<span>Zatím žádná aktivita.</span>}
      />
    </div>
  )
}
