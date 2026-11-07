import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { AREA_META, PROFILE_AREAS } from './area-meta'

const HINT: Partial<Record<(typeof PROFILE_AREAS)[number], string>> = {
  progress: 'Váha, míry, fotky, síla',
  stats: 'Level, tiery, ranky partií',
  rewards: 'Za co utratíš XP',
  calendar: 'Splněné questy po dnech',
  settings: 'Profil, vzhled, export',
}

/** The player's menu: everything that is not a daily tab hangs off the profile. */
export function ProfileAreaLinks() {
  return (
    <nav aria-label="Oblasti hráče" className="grid gap-2">
      {PROFILE_AREAS.map((area) => {
        const meta = AREA_META[area]
        const Icon = meta.icon
        return (
          <Link
            key={area}
            href={meta.href}
            className="rounded-control border-border bg-surface hover:bg-surface-raised flex min-h-14 items-center gap-3 border px-4 py-3 transition-colors active:scale-[0.99]"
          >
            <span className="rounded-control bg-surface-raised text-system grid size-9 place-items-center">
              <Icon className="size-5" aria-hidden />
            </span>
            <span className="flex-1">
              <span className="block text-sm font-semibold">{meta.label}</span>
              <span className="text-muted block text-xs">{HINT[area]}</span>
            </span>
            <ChevronRight className="text-muted size-4" aria-hidden />
          </Link>
        )
      })}
    </nav>
  )
}
