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

type Props = { byEventTotal: XpHistory['byEventTotal']; total: number }

export function XpBreakdown({ byEventTotal, total }: Props) {
  const rows = Object.entries(byEventTotal)
    .map(([event, v]) => ({ event, xp: v!.xp, count: v!.count }))
    .sort((a, b) => b.xp - a.xp)
  return (
    <div className="border-border bg-surface rounded-lg border p-4">
      <h2 className="text-foreground mb-3 text-sm font-semibold">Rozpis podle aktivity</h2>
      {rows.length === 0 ? (
        <p className="text-muted text-sm">Zatím žádná aktivita.</p>
      ) : (
        <table className="w-full text-sm">
          <tbody>
            {rows.map((r) => (
              <tr key={r.event} className="border-border border-b last:border-0">
                <td className="text-foreground py-2">{LABELS[r.event] ?? r.event}</td>
                <td className="text-muted py-2 text-right">{r.count}×</td>
                <td className="text-foreground py-2 text-right font-semibold">
                  {r.xp.toLocaleString('cs-CZ')} XP
                </td>
                <td className="text-muted py-2 pl-3 text-right text-xs">
                  {total > 0 ? Math.round((r.xp / total) * 100) : 0}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
