'use client'

import Image from 'next/image'

type PhotoItem = {
  id: number
  takenAt: string
  pose: string
  thumbUrl: string
  note: string | null
}
type Props = { photos: PhotoItem[]; onPhotoTap: (index: number) => void }

const POSE_LABELS: Record<string, string> = {
  front: 'Zepředu',
  side: 'Z boku',
  back: 'Zezadu',
  other: 'Jiné',
}

export function PhotoTimeline({ photos, onPhotoTap }: Props) {
  if (photos.length === 0)
    return <p className="py-8 text-center text-sm text-[#6b7280]">Žádné fotky</p>

  return (
    <div className="flex flex-col gap-3">
      {photos.map((p, i) => (
        <button
          key={p.id}
          onClick={() => onPhotoTap(i)}
          className="flex gap-3 rounded-lg border border-[#1f2733] bg-[#141a22] p-2 text-left"
        >
          <Image
            src={p.thumbUrl}
            alt={`${p.pose} ${p.takenAt}`}
            width={96}
            height={96}
            className="h-24 w-24 rounded-md object-cover"
            loading="lazy"
            unoptimized
          />
          <div className="flex flex-col justify-center">
            <span className="text-sm font-medium text-[#e5e7eb]">{formatDate(p.takenAt)}</span>
            <span className="text-xs text-[#6b7280]">{POSE_LABELS[p.pose] ?? p.pose}</span>
            {p.note ? <span className="mt-1 text-xs text-[#6b7280]">{p.note}</span> : null}
          </div>
        </button>
      ))}
    </div>
  )
}

function formatDate(dateStr: string) {
  const [y, m, d] = dateStr.split('-')
  return `${Number(d)}.${Number(m)}.${y}`
}
