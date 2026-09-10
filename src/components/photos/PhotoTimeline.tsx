'use client'

import Image from 'next/image'
import { Card } from '@/components/ui'

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
  if (photos.length === 0) return <p className="text-muted py-8 text-center text-sm">Žádné fotky</p>

  return (
    <div className="flex flex-col gap-3">
      {photos.map((p, i) => (
        <Card
          key={p.id}
          as="button"
          type="button"
          variant="interactive"
          padding="sm"
          onClick={() => onPhotoTap(i)}
          className="w-full text-left"
        >
          <span className="flex gap-3">
            <Image
              src={p.thumbUrl}
              alt={`${p.pose} ${p.takenAt}`}
              width={96}
              height={96}
              className="h-24 w-24 rounded-md object-cover"
              loading="lazy"
              unoptimized
            />
            <span className="flex flex-col justify-center">
              <span className="text-foreground text-sm font-medium">{formatDate(p.takenAt)}</span>
              <span className="text-muted text-xs">{POSE_LABELS[p.pose] ?? p.pose}</span>
              {p.note ? <span className="text-muted mt-1 text-xs">{p.note}</span> : null}
            </span>
          </span>
        </Card>
      ))}
    </div>
  )
}

function formatDate(dateStr: string) {
  const [y, m, d] = dateStr.split('-')
  return `${Number(d)}.${Number(m)}.${y}`
}
