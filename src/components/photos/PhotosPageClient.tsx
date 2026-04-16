'use client'

import { useState, useEffect, useCallback } from 'react'
import { PhotoGrid } from './PhotoGrid'
import { PhotoTimeline } from './PhotoTimeline'
import { BeforeAfter } from './BeforeAfter'
import { UploadSheet } from './UploadSheet'
import { Lightbox } from './Lightbox'

type PhotoItem = {
  id: number
  takenAt: string
  weekStart: string | null
  pose: string
  thumbUrl: string
  fullUrl: string
  widthPx: number | null
  heightPx: number | null
  note: string | null
  createdAt: string
}

type ViewMode = 'grid' | 'timeline' | 'compare'

const VIEW_OPTIONS = [
  { value: 'grid', label: 'Grid' },
  { value: 'timeline', label: 'Timeline' },
  { value: 'compare', label: 'Před×Po' },
] as const

export function PhotosPageClient() {
  const [view, setView] = useState<ViewMode>('grid')
  const [photos, setPhotos] = useState<PhotoItem[]>([])
  const [dates, setDates] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const loadPhotos = useCallback(async () => {
    setLoading(true)
    const [photosRes, datesRes] = await Promise.all([
      fetch('/api/photos?limit=200').then((r) => r.json()),
      fetch('/api/photos/dates').then((r) => r.json()),
    ])
    setPhotos(photosRes.items ?? [])
    setDates(datesRes.dates ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    loadPhotos()
  }, [loadPhotos])

  return (
    <div className="flex flex-col gap-3">
      <div role="tablist" className="flex gap-1 rounded-lg bg-[#141a22] p-1">
        {VIEW_OPTIONS.map((o) => (
          <button
            key={o.value}
            role="tab"
            aria-selected={view === o.value}
            onClick={() => setView(o.value)}
            className={
              'flex-1 rounded-md px-3 py-1.5 text-center text-sm transition-colors ' +
              (view === o.value
                ? 'bg-[#10b981] font-semibold text-[#0a0e14]'
                : 'text-[#6b7280] hover:text-[#e5e7eb]')
            }
          >
            {o.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="py-8 text-center text-sm text-[#6b7280]">Načítám...</p>
      ) : view === 'grid' ? (
        <PhotoGrid photos={photos} onPhotoTap={setLightboxIndex} />
      ) : view === 'timeline' ? (
        <PhotoTimeline photos={photos} onPhotoTap={setLightboxIndex} />
      ) : (
        <BeforeAfter photos={photos} dates={dates} />
      )}

      <button
        onClick={() => setUploadOpen(true)}
        className="fixed right-4 bottom-20 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-[#10b981] text-2xl font-bold text-[#0a0e14] shadow-lg"
        aria-label="Nahrát fotku"
      >
        +
      </button>

      <UploadSheet open={uploadOpen} onOpenChange={setUploadOpen} onUploaded={loadPhotos} />

      {lightboxIndex !== null ? (
        <Lightbox
          photos={photos.map((p) => ({
            id: p.id,
            fullUrl: p.fullUrl,
            takenAt: p.takenAt,
            pose: p.pose,
          }))}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onDeleted={loadPhotos}
        />
      ) : null}
    </div>
  )
}
