'use client'

import Image from 'next/image'
import { PoseBadge } from './PoseBadge'
import { Heading } from '@/components/ui'

type PhotoItem = {
  id: number
  takenAt: string
  weekStart: string | null
  pose: string
  thumbUrl: string
}
type Props = { photos: PhotoItem[]; onPhotoTap: (index: number) => void }

export function PhotoGrid({ photos, onPhotoTap }: Props) {
  if (photos.length === 0) return <p className="text-muted py-8 text-center text-sm">Žádné fotky</p>

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
          <Heading level={3} variant="region" className="mb-2">
            Týden od {formatDate(weekStart)}
          </Heading>
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 md:grid-cols-4">
            {group.photos.map((p) => (
              <button
                key={p.id}
                onClick={() => onPhotoTap(p.globalIdx)}
                className="hud-clip relative aspect-square overflow-hidden"
              >
                <Image
                  src={p.thumbUrl}
                  alt={`${p.pose} ${p.takenAt}`}
                  fill
                  sizes="(max-width: 768px) 33vw, 200px"
                  className="object-cover"
                  loading="lazy"
                  unoptimized
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
