import { db } from '@/db/client'
import { sessions } from '@/db/schema'
import { sql } from 'drizzle-orm'
import { fetchMuscleVolumesLast8Weeks } from '@/lib/queries/muscle-rank'
import { MUSCLE_GROUPS } from '@/db/seed/muscle-groups'
import { volumeToRank, type Rank, RANK_COLORS } from '@/lib/muscle-rank'
import { MuscleRank } from './MuscleRank'
import Link from 'next/link'

type RankSummary =
  | { kind: 'empty' }
  | {
      kind: 'ranked'
      ranks: Record<string, Rank>
      counts: Record<Rank, number>
      weakest3: Array<{ slug: string; name: string; rank: Rank; volume: number }>
    }

const RANK_ORDER: Record<Rank, number> = { D: 0, C: 1, B: 2, A: 3, S: 4 }

export function computeRankSummary(
  volumes: Record<string, number>,
  sessionCount: number
): RankSummary {
  if (sessionCount < 3) return { kind: 'empty' }

  const ranks: Record<string, Rank> = {}
  const counts: Record<Rank, number> = { S: 0, A: 0, B: 0, C: 0, D: 0 }
  const rows: Array<{ slug: string; name: string; rank: Rank; volume: number }> = []

  for (const mg of MUSCLE_GROUPS) {
    const volume = volumes[mg.slug] ?? 0
    const rank = volumeToRank(volume, mg.slug)
    ranks[mg.slug] = rank
    counts[rank] += 1
    rows.push({ slug: mg.slug, name: mg.name, rank, volume })
  }

  rows.sort((a, b) => {
    if (RANK_ORDER[a.rank] !== RANK_ORDER[b.rank]) return RANK_ORDER[a.rank] - RANK_ORDER[b.rank]
    return a.volume - b.volume
  })

  return { kind: 'ranked', ranks, counts, weakest3: rows.slice(0, 3) }
}

async function fetchSessionCountLast8Weeks(userId: string): Promise<number> {
  const since = new Date()
  since.setDate(since.getDate() - 56)
  const sinceStr = since.toISOString().slice(0, 10)
  const [rows] = await db.execute(
    sql`SELECT COUNT(*) AS n FROM ${sessions} WHERE ${sessions.userId} = ${userId} AND ${sessions.finishedAt} IS NOT NULL AND ${sessions.finishedAt} >= ${sinceStr}`
  )
  const first = (rows as unknown as Array<{ n: number | string }>)[0]
  return Number(first?.n ?? 0)
}

type Props = { userId: string }

export async function MuscleRankSection({ userId }: Props) {
  const [volumes, sessionCount] = await Promise.all([
    fetchMuscleVolumesLast8Weeks(db, userId),
    fetchSessionCountLast8Weeks(userId),
  ])
  const summary = computeRankSummary(volumes, sessionCount)

  if (summary.kind === 'empty') {
    return (
      <div className="border-border bg-surface flex flex-col items-center gap-3 rounded-xl border p-6 text-center">
        <p className="text-foreground text-sm">
          Začni trénovat, rank se ti vykreslí po prvních pár tréninzích.
        </p>
        <Link
          href="/training"
          className="bg-accent rounded-md px-3 py-1 text-xs font-medium text-white"
        >
          Spustit trénink
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-center">
        <MuscleRank ranks={summary.ranks} className="h-72 w-72" />
      </div>
      <div className="text-muted text-center text-xs">
        {(['S', 'A', 'B', 'C', 'D'] as const).map((r) => `${summary.counts[r]}× ${r}`).join(' · ')}
      </div>
      <div className="border-border bg-surface rounded-xl border p-4">
        <h4 className="text-foreground mb-2 text-xs font-medium tracking-wider uppercase">Doplň</h4>
        <ul className="space-y-1">
          {summary.weakest3.map(({ slug, name, rank }) => (
            <li key={slug} className="flex items-center justify-between text-sm">
              <span className="text-foreground">{name}</span>
              <span className="font-medium" style={{ color: RANK_COLORS[rank] }}>
                {rank}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
