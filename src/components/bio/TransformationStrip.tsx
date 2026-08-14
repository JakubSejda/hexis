'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { Lightbox } from '@/components/photos/Lightbox'

type Photo = {
  id: number
  takenAt: string
  pose: 'front' | 'side' | 'back' | 'other'
  fullUrl: string
  thumbUrl: string
  weightKg: number | null
}

type Props = { photos: Photo[] }

function fmtDate(iso: string): string {
  const [y, m, d] = iso.split('-')
  return `${Number(d)}. ${Number(m)}. ${y}`
}

export function TransformationStrip({ photos }: Props) {
  const [openIdx, setOpenIdx] = useState<number | null>(null)

  if (photos.length === 0) {
    return (
      <Link
        href="/progress"
        className="border-border bg-surface text-muted hover:border-accent flex items-center justify-between rounded-lg border p-4 transition-colors"
      >
        <span>Přidej fotku</span>
        <span aria-hidden>→</span>
      </Link>
    )
  }

  const first = photos[0]!
  const last = photos[photos.length - 1]!
  const showThenNow = photos.length >= 2

  return (
    <div className="flex flex-col gap-3">
      {showThenNow ? (
        <div className="grid grid-cols-2 gap-3">
          <PhotoTile label="THEN" photo={first} />
          <PhotoTile label="NOW" photo={last} />
        </div>
      ) : (
        <div className="border-border bg-surface flex flex-col items-center gap-2 rounded-lg border p-4">
          <span className="text-muted text-xs tracking-[0.2em] uppercase">Day 1</span>
          <Image
            src={first.thumbUrl}
            alt={first.takenAt}
            width={240}
            height={320}
            unoptimized
            className="h-auto w-60 rounded object-cover"
          />
          <span className="text-muted text-xs">{fmtDate(first.takenAt)}</span>
        </div>
      )}

      <div className="overflow-x-auto">
        <div className="flex gap-2">
          {photos.map((p, i) => (
            <button
              key={p.id}
              type="button"
              aria-label={`Open photo ${fmtDate(p.takenAt)}`}
              onClick={() => setOpenIdx(i)}
              className="border-border hover:border-accent shrink-0 rounded border bg-black"
            >
              <Image
                src={p.thumbUrl}
                alt={p.takenAt}
                width={64}
                height={96}
                unoptimized
                className="h-24 w-16 object-cover"
              />
            </button>
          ))}
        </div>
      </div>

      {openIdx !== null && (
        <Lightbox
          photos={photos.map((p) => ({
            id: p.id,
            takenAt: p.takenAt,
            pose: p.pose,
            fullUrl: p.fullUrl,
          }))}
          initialIndex={openIdx}
          onClose={() => setOpenIdx(null)}
          onDeleted={() => {}}
        />
      )}
    </div>
  )
}

function PhotoTile({ label, photo }: { label: string; photo: Photo }) {
  return (
    <div className="border-border bg-surface flex flex-col gap-2 rounded-lg border p-3">
      <span className="text-muted text-xs tracking-[0.2em] uppercase">{label}</span>
      <Image
        src={photo.thumbUrl}
        alt={`${label} ${photo.takenAt}`}
        width={240}
        height={320}
        unoptimized
        className="h-auto w-full rounded object-cover"
      />
      <div className="flex items-center justify-between text-xs">
        <span className="text-foreground">{fmtDate(photo.takenAt)}</span>
        {photo.weightKg !== null && <span className="text-muted">{photo.weightKg} kg</span>}
      </div>
    </div>
  )
}
