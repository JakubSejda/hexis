'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { Card } from '@/components/ui'
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
      <Card as={Link} href="/progress/photos" variant="interactive" className="block">
        <div className="flex items-center gap-3">
          <span className="rounded-control bg-surface-raised text-system grid size-11 shrink-0 place-items-center text-lg">
            ◐
          </span>
          <span className="flex-1">
            <span className="block font-semibold">Přidej první fotku</span>
            <span className="text-muted block text-xs">
              Jedna fotka týdně ukáže změnu, kterou v zrcadle nevidíš. +15 XP
            </span>
          </span>
          <span aria-hidden className="text-muted">
            →
          </span>
        </div>
      </Card>
    )
  }

  const first = photos[0]!
  const last = photos[photos.length - 1]!
  const showThenNow = photos.length >= 2

  return (
    <div className="flex flex-col gap-3">
      {showThenNow ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <PhotoTile label="Začátek" photo={first} />
          <PhotoTile label="Teď" photo={last} />
        </div>
      ) : (
        <Card>
          <div className="flex flex-col items-center gap-2">
            <span className="text-muted text-xs font-semibold tracking-[0.12em] uppercase">
              Den 1
            </span>
            <Image
              src={first.thumbUrl}
              alt={first.takenAt}
              width={240}
              height={320}
              unoptimized
              className="h-auto w-60 object-cover"
            />
            <span className="text-muted text-xs">{fmtDate(first.takenAt)}</span>
          </div>
        </Card>
      )}

      <div className="overflow-x-auto">
        <div className="flex gap-2">
          {photos.map((p, i) => (
            <button
              key={p.id}
              type="button"
              aria-label={`Otevřít fotku z ${fmtDate(p.takenAt)}`}
              onClick={() => setOpenIdx(i)}
              className="rounded-control border-border hover:border-accent shrink-0 overflow-hidden border bg-black"
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
    <Card padding="sm">
      <div className="flex flex-col gap-2">
        <span className="text-muted text-xs font-semibold tracking-[0.12em] uppercase">
          {label}
        </span>
        <Image
          src={photo.thumbUrl}
          alt={`${label} ${photo.takenAt}`}
          width={240}
          height={320}
          unoptimized
          className="h-auto w-full object-cover"
        />
        <div className="flex items-center justify-between text-xs">
          <span className="text-foreground">{fmtDate(photo.takenAt)}</span>
          {photo.weightKg !== null && <span className="text-muted">{photo.weightKg} kg</span>}
        </div>
      </div>
    </Card>
  )
}
