import Image from 'next/image'
import Link from 'next/link'
import { ProgressBar } from '@/components/ui'
import { RankLens } from './RankLens'

const ROMAN = ['I', 'II', 'III', 'IV', 'V'] as const

type Props = {
  level: number
  tier: number
  tierName: string
  currentXp: number
  maxXp: number
  xpForNext: number
  dayCount: number | null
  sessionsTotal: number
}

const nf = new Intl.NumberFormat('cs-CZ')

/** The character: art, level, tier lens and the XP bar. Taps through to the profile. */
export function PlayerHero({
  level,
  tier,
  tierName,
  currentXp,
  maxXp,
  xpForNext,
  dayCount,
  sessionsTotal,
}: Props) {
  const meta = [dayCount != null ? `Den ${dayCount}` : null, `${sessionsTotal} tréninků`]
    .filter(Boolean)
    .join(' · ')

  return (
    <Link
      href="/bio"
      aria-label={`Profil hráče, level ${level}`}
      className="animate-hud-power-on md:rounded-card relative -mx-4 -mt-2 flex h-80 flex-col justify-end px-4 pb-4 md:mx-0 md:mt-0 md:overflow-hidden"
    >
      <Image
        src="/images/hero-player.svg"
        alt=""
        fill
        priority
        unoptimized
        sizes="(min-width: 768px) 640px, 100vw"
        className="hero-art object-cover object-[center_22%]"
      />
      <span aria-hidden className="hero-glow absolute inset-0" />
      <RankLens
        label={ROMAN[tier - 1] ?? String(tier)}
        title={`Tier ${tierName}`}
        className="absolute top-3 right-4"
      />
      <div className="relative flex items-end justify-between">
        <div className="font-display leading-none font-black uppercase">
          <span className="text-accent block text-xl">Level</span>
          <span className="hero-level block text-[5.5rem]">{level}</span>
        </div>
        <div className="pb-2 text-right">
          <div className="font-display text-xl font-black uppercase">{tierName}</div>
          <div className="text-muted mt-1 text-xs">{meta}</div>
        </div>
      </div>
      <div className="relative mt-3">
        <ProgressBar
          value={currentXp}
          max={maxXp}
          variant="xp"
          height={10}
          label={`XP do levelu ${level + 1}`}
        />
        <div className="text-muted mt-1.5 flex justify-between text-xs font-semibold">
          <span>
            <b className="text-foreground">{nf.format(currentXp)}</b> / {nf.format(maxXp)} XP
          </span>
          <span>
            {nf.format(xpForNext)} do levelu {level + 1}
          </span>
        </div>
      </div>
    </Link>
  )
}
