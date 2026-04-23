'use client'

import Image from 'next/image'
import { useState } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { Button, useToast } from '@/components/ui'
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
          <Button
            variant={confirming ? 'danger' : 'ghost'}
            size="sm"
            onClick={handleDelete}
            disabled={deleting}
            className={confirming ? undefined : 'text-danger'}
          >
            {confirming ? 'Opravdu smazat?' : 'Smazat'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-white/70"
            aria-label="Zavřít"
          >
            <X size={16} aria-hidden />
          </Button>
        </div>
      </div>
      <div className="relative flex flex-1 items-center justify-center overflow-hidden">
        <Image
          src={photo.fullUrl}
          alt={`${photo.pose} ${photo.takenAt}`}
          fill
          sizes="100vw"
          className="object-contain"
          unoptimized
          priority
        />
      </div>
      <div className="flex justify-between p-4">
        <Button
          variant="ghost"
          onClick={prev}
          disabled={index === 0}
          className="inline-flex items-center gap-1 text-white disabled:opacity-30"
        >
          <ChevronLeft size={14} aria-hidden />
          Předchozí
        </Button>
        <span className="self-center text-sm text-white/50">
          {index + 1} / {photos.length}
        </span>
        <Button
          variant="ghost"
          onClick={next}
          disabled={index === photos.length - 1}
          className="inline-flex items-center gap-1 text-white disabled:opacity-30"
        >
          Další
          <ChevronRight size={14} aria-hidden />
        </Button>
      </div>
    </div>
  )
}
