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
    <div className="rounded-lg border border-[#1F2733] bg-[#141A22] p-4">
      <h2 className="mb-3 text-sm font-semibold text-[#e5e7eb]">Rozpis podle aktivity</h2>
      {rows.length === 0 ? (
        <p className="text-sm text-[#6b7280]">Zatím žádná aktivita.</p>
      ) : (
        <table className="w-full text-sm">
          <tbody>
            {rows.map((r) => (
              <tr key={r.event} className="border-b border-[#1f2733] last:border-0">
                <td className="py-2 text-[#e5e7eb]">{LABELS[r.event] ?? r.event}</td>
                <td className="py-2 text-right text-[#6b7280]">{r.count}×</td>
                <td className="py-2 text-right font-semibold text-[#e5e7eb]">
                  {r.xp.toLocaleString('cs-CZ')} XP
                </td>
                <td className="py-2 pl-3 text-right text-xs text-[#6b7280]">
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
