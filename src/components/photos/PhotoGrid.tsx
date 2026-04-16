'use client'

import { PoseBadge } from './PoseBadge'

type PhotoItem = {
  id: number
  takenAt: string
  weekStart: string | null
  pose: string
  thumbUrl: string
}
type Props = { photos: PhotoItem[]; onPhotoTap: (index: number) => void }

export function PhotoGrid({ photos, onPhotoTap }: Props) {
  if (photos.length === 0)
    return <p className="py-8 text-center text-sm text-[#6b7280]">Žádné fotky</p>

  const groups = new Map<string, { photos: (PhotoItem & { globalIdx: number })[] }>()
  photos.forEach((p, i) => {
    const key = p.weekStart ?? p.takenAt
    let group = groups.get(key)
    if (!group) {
      group = { photos: [] }
      groups.set(key, group)
    }
    group.photos.push({ ...p, globalIdx: i })
  })

  return (
    <div className="flex flex-col gap-4">
      {Array.from(groups.entries()).map(([weekStart, group]) => (
        <div key={weekStart}>
          <h3 className="mb-2 text-xs font-medium text-[#6b7280]">
            Týden od {formatDate(weekStart)}
          </h3>
          <div className="grid grid-cols-3 gap-1.5">
            {group.photos.map((p) => (
              <button
                key={p.id}
                onClick={() => onPhotoTap(p.globalIdx)}
                className="relative aspect-square overflow-hidden rounded-lg"
              >
                <img
                  src={p.thumbUrl}
                  alt={`${p.pose} ${p.takenAt}`}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
                <PoseBadge pose={p.pose} />
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function formatDate(dateStr: string) {
  const [, m, d] = dateStr.split('-')
  return `${Number(d)}.${Number(m)}.`
}
