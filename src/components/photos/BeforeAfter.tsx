'use client'

import Image from 'next/image'
import { useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Select } from '@/components/ui'

type PhotoItem = { id: number; takenAt: string; pose: string; fullUrl: string; thumbUrl: string }
type Props = { photos: PhotoItem[]; dates: string[] }

const POSES = [
  { value: '', label: 'Vše' },
  { value: 'front', label: 'Zepředu' },
  { value: 'side', label: 'Z boku' },
  { value: 'back', label: 'Zezadu' },
] as const

export function BeforeAfter({ photos, dates }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const fromUrl = searchParams.get('pose') ?? ''
  const poseFilter = POSES.some((p) => p.value === fromUrl) ? fromUrl : ''

  const setPoseFilter = (next: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (next === '') params.delete('pose')
    else params.set('pose', next)
    const query = params.toString()
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }
  const [beforeDate, setBeforeDate] = useState(dates[dates.length - 1] ?? '')
  const [afterDate, setAfterDate] = useState(dates[0] ?? '')
  const [sliderPos, setSliderPos] = useState(50)

  const filtered = poseFilter ? photos.filter((p) => p.pose === poseFilter) : photos
  const beforePhoto = filtered.find((p) => p.takenAt === beforeDate)
  const afterPhoto = filtered.find((p) => p.takenAt === afterDate)

  if (dates.length < 2) {
    return (
      <p className="text-muted py-8 text-center text-sm">
        Potřebuješ alespoň fotky ze 2 různých dní
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        {POSES.map((p) => (
          <button
            key={p.value}
            onClick={() => setPoseFilter(p.value)}
            className={
              'hud-clip-sm flex-1 px-2 py-1.5 text-xs transition-colors ' +
              (poseFilter === p.value
                ? 'bg-system text-background font-semibold'
                : 'bg-border text-muted')
            }
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <div className="flex-1">
          <Select size="sm" value={beforeDate} onChange={(e) => setBeforeDate(e.target.value)}>
            {dates.map((d) => (
              <option key={d} value={d}>
                {formatDate(d)}
              </option>
            ))}
          </Select>
        </div>
        <span className="text-muted self-center text-sm">→</span>
        <div className="flex-1">
          <Select size="sm" value={afterDate} onChange={(e) => setAfterDate(e.target.value)}>
            {dates.map((d) => (
              <option key={d} value={d}>
                {formatDate(d)}
              </option>
            ))}
          </Select>
        </div>
      </div>
      {beforePhoto && afterPhoto ? (
        <div className="hud-clip relative aspect-[3/4] w-full overflow-hidden">
          <Image
            src={afterPhoto.fullUrl}
            alt={`After ${afterDate}`}
            fill
            sizes="(max-width: 768px) 100vw, 600px"
            className="object-cover"
            unoptimized
          />
          <div
            className="absolute inset-0 overflow-hidden"
            style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
          >
            <Image
              src={beforePhoto.fullUrl}
              alt={`Before ${beforeDate}`}
              fill
              sizes="(max-width: 768px) 100vw, 600px"
              className="object-cover"
              unoptimized
            />
          </div>
          <div className="absolute top-0 bottom-0 w-0.5 bg-white" style={{ left: `${sliderPos}%` }}>
            <div className="hud-hex absolute top-1/2 left-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 border-2 border-white bg-black/50" />
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={sliderPos}
            onChange={(e) => setSliderPos(Number(e.target.value))}
            className="absolute inset-0 h-full w-full cursor-col-resize opacity-0"
          />
          <span className="hud-clip-sm absolute top-2 left-2 bg-black/60 px-2 py-0.5 text-xs text-white">
            Před
          </span>
          <span className="hud-clip-sm absolute top-2 right-2 bg-black/60 px-2 py-0.5 text-xs text-white">
            Po
          </span>
        </div>
      ) : (
        <p className="text-muted py-8 text-center text-sm">Žádná fotka pro vybranou kombinaci</p>
      )}
    </div>
  )
}

function formatDate(dateStr: string) {
  const [y, m, d] = dateStr.split('-')
  return `${Number(d)}.${Number(m)}.${y}`
}
