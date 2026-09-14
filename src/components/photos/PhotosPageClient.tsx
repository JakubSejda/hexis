'use client'

import { useState, useEffect, useCallback } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Skeleton, Tabs } from '@/components/ui'
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

const VIEWS: ViewMode[] = ['grid', 'timeline', 'compare']

export function PhotosPageClient() {
  // The open tab is in the URL, so a reload or a shared link lands on the same
  // view (WIG audit, finding 37).
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const fromUrl = searchParams.get('view') as ViewMode | null
  const view: ViewMode = fromUrl && VIEWS.includes(fromUrl) ? fromUrl : 'grid'

  const setView = (next: ViewMode) => {
    const params = new URLSearchParams(searchParams.toString())
    if (next === 'grid') params.delete('view')
    else params.set('view', next)
    const query = params.toString()
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }
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
          <Tabs.Trigger value="grid">Mřížka</Tabs.Trigger>
          <Tabs.Trigger value="timeline">Časová osa</Tabs.Trigger>
          <Tabs.Trigger value="compare">Před×Po</Tabs.Trigger>
        </Tabs.List>
        {loading ? (
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 md:grid-cols-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} shape="card" />
            ))}
          </div>
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
        className="bg-accent text-background fixed right-4 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-30 flex h-14 w-14 items-center justify-center rounded-full text-2xl font-bold shadow-lg"
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
