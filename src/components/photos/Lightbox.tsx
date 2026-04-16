'use client'

import { useState } from 'react'
import { useToast } from '@/components/ui/Toast'
import { useXpFeedback } from '@/components/xp/XpFeedbackProvider'

type Photo = {
  id: number
  fullUrl: string
  takenAt: string
  pose: string
}

type Props = {
  photos: Photo[]
  initialIndex: number
  onClose: () => void
  onDeleted: () => void
}

export function Lightbox({ photos, initialIndex, onClose, onDeleted }: Props) {
  const [index, setIndex] = useState(initialIndex)
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const toast = useToast()
  const { notifyXp } = useXpFeedback()

  const photo = photos[index]
  if (!photo) return null

  const prev = () => setIndex((i) => Math.max(0, i - 1))
  const next = () => setIndex((i) => Math.min(photos.length - 1, i + 1))

  const handleDelete = async () => {
    if (!confirming) {
      setConfirming(true)
      return
    }
    setDeleting(true)
    try {
      const res = await fetch(`/api/photos/${photo.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      const body = await res.json()
      notifyXp(body)
      toast.show('Fotka smazána', 'success')
      onDeleted()
      onClose()
    } catch {
      toast.show('Smazání selhalo', 'error')
    } finally {
      setDeleting(false)
      setConfirming(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="flex items-center justify-between p-4">
        <span className="text-sm text-white/70">
          {photo.takenAt} · {photo.pose}
        </span>
        <div className="flex gap-3">
          <button
            onClick={handleDelete}
            disabled={deleting}
            className={
              'rounded px-3 py-1 text-sm ' +
              (confirming ? 'bg-[#ef4444] text-white' : 'text-[#ef4444]')
            }
          >
            {confirming ? 'Opravdu smazat?' : 'Smazat'}
          </button>
          <button onClick={onClose} className="text-white/70">
            ✕
          </button>
        </div>
      </div>
      <div className="flex flex-1 items-center justify-center overflow-hidden">
        <img
          src={photo.fullUrl}
          alt={`${photo.pose} ${photo.takenAt}`}
          className="max-h-full max-w-full object-contain"
        />
      </div>
      <div className="flex justify-between p-4">
        <button
          onClick={prev}
          disabled={index === 0}
          className="rounded px-4 py-2 text-white disabled:opacity-30"
        >
          ‹ Předchozí
        </button>
        <span className="self-center text-sm text-white/50">
          {index + 1} / {photos.length}
        </span>
        <button
          onClick={next}
          disabled={index === photos.length - 1}
          className="rounded px-4 py-2 text-white disabled:opacity-30"
        >
          Další ›
        </button>
      </div>
    </div>
  )
}
