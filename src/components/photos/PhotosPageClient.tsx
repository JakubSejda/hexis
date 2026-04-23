'use client'

import { useState, useEffect, useCallback } from 'react'
import { Tabs } from '@/components/ui'
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

  // Initial mount fetch. Inlined (not delegated to loadPhotos) so no setState
  // runs synchronously inside the effect body — the rule cascading-renders
  // check fires when an effect directly or indirectly calls setState before
  // awaiting.
  useEffect(() => {
    let alive = true
    ;(async () => {
      const [photosRes, datesRes] = await Promise.all([
        fetch('/api/photos?limit=200').then((r) => r.json()),
        fetch('/api/photos/dates').then((r) => r.json()),
      ])
      if (!alive) return
      setPhotos(photosRes.items ?? [])
      setDates(datesRes.dates ?? [])
      setLoading(false)
    })()
    return () => {
      alive = false
    }
  }, [])

  return (
    <div className="flex flex-col gap-3">
      <Tabs.Root value={view} onValueChange={(v) => setView(v as ViewMode)}>
        <Tabs.List>
          <Tabs.Trigger value="grid">Grid</Tabs.Trigger>
          <Tabs.Trigger value="timeline">Timeline</Tabs.Trigger>
          <Tabs.Trigger value="compare">Před×Po</Tabs.Trigger>
        </Tabs.List>
        {loading ? (
          <p className="text-muted py-8 text-center text-sm">Načítám...</p>
        ) : (
          <>
            <Tabs.Content value="grid">
              <PhotoGrid photos={photos} onPhotoTap={setLightboxIndex} />
            </Tabs.Content>
            <Tabs.Content value="timeline">
              <PhotoTimeline photos={photos} onPhotoTap={setLightboxIndex} />
            </Tabs.Content>
            <Tabs.Content value="compare">
              <BeforeAfter photos={photos} dates={dates} />
            </Tabs.Content>
          </>
        )}
      </Tabs.Root>

      <button
        onClick={() => setUploadOpen(true)}
        className="bg-primary text-background fixed right-4 bottom-20 z-30 flex h-14 w-14 items-center justify-center rounded-full text-2xl font-bold shadow-lg"
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
