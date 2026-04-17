'use client'

import Image from 'next/image'
import { useState } from 'react'

type PhotoItem = { id: number; takenAt: string; pose: string; fullUrl: string; thumbUrl: string }
type Props = { photos: PhotoItem[]; dates: string[] }

const POSES = [
  { value: '', label: 'Vše' },
  { value: 'front', label: 'Front' },
  { value: 'side', label: 'Side' },
  { value: 'back', label: 'Back' },
] as const

export function BeforeAfter({ photos, dates }: Props) {
  const [poseFilter, setPoseFilter] = useState('')
  const [beforeDate, setBeforeDate] = useState(dates[dates.length - 1] ?? '')
  const [afterDate, setAfterDate] = useState(dates[0] ?? '')
  const [sliderPos, setSliderPos] = useState(50)

  const filtered = poseFilter ? photos.filter((p) => p.pose === poseFilter) : photos
  const beforePhoto = filtered.find((p) => p.takenAt === beforeDate)
  const afterPhoto = filtered.find((p) => p.takenAt === afterDate)

  if (dates.length < 2) {
    return (
      <p className="py-8 text-center text-sm text-[#6b7280]">
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
              'flex-1 rounded-md px-2 py-1.5 text-xs transition-colors ' +
              (poseFilter === p.value
                ? 'bg-[#10b981] font-semibold text-[#0a0e14]'
                : 'bg-[#1f2733] text-[#6b7280]')
            }
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <select
          value={beforeDate}
          onChange={(e) => setBeforeDate(e.target.value)}
          className="flex-1 rounded-lg border border-[#1f2733] bg-[#141a22] px-2 py-1.5 text-sm text-[#e5e7eb]"
        >
          {dates.map((d) => (
            <option key={d} value={d}>
              {formatDate(d)}
            </option>
          ))}
        </select>
        <span className="self-center text-sm text-[#6b7280]">→</span>
        <select
          value={afterDate}
          onChange={(e) => setAfterDate(e.target.value)}
          className="flex-1 rounded-lg border border-[#1f2733] bg-[#141a22] px-2 py-1.5 text-sm text-[#e5e7eb]"
        >
          {dates.map((d) => (
            <option key={d} value={d}>
              {formatDate(d)}
            </option>
          ))}
        </select>
      </div>
      {beforePhoto && afterPhoto ? (
        <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg">
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
            <div className="absolute top-1/2 left-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-black/50" />
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={sliderPos}
            onChange={(e) => setSliderPos(Number(e.target.value))}
            className="absolute inset-0 h-full w-full cursor-col-resize opacity-0"
          />
          <span className="absolute top-2 left-2 rounded bg-black/60 px-2 py-0.5 text-xs text-white">
            Před
          </span>
          <span className="absolute top-2 right-2 rounded bg-black/60 px-2 py-0.5 text-xs text-white">
            Po
          </span>
        </div>
      ) : (
        <p className="py-8 text-center text-sm text-[#6b7280]">
          Žádná fotka pro vybranou kombinaci
        </p>
      )}
    </div>
  )
}

function formatDate(dateStr: string) {
  const [y, m, d] = dateStr.split('-')
  return `${Number(d)}.${Number(m)}.${y}`
}
