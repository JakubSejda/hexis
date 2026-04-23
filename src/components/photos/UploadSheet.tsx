'use client'

import { useState, useRef } from 'react'
import { BottomSheet, useToast } from '@/components/ui'
import { useXpFeedback } from '@/components/xp/XpFeedbackProvider'

type Props = {
  open: boolean
  onOpenChange: (v: boolean) => void
  onUploaded: () => void
}

const POSES = [
  { value: 'front', label: 'Front' },
  { value: 'side', label: 'Side' },
  { value: 'back', label: 'Back' },
  { value: 'other', label: 'Other' },
] as const

export function UploadSheet({ open, onOpenChange, onUploaded }: Props) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [pose, setPose] = useState<string>('front')
  const [takenAt, setTakenAt] = useState(new Date().toISOString().slice(0, 10))
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const toast = useToast()
  const { notifyXp } = useXpFeedback()

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return

    let blob: File | Blob = f

    if (
      f.type === 'image/heic' ||
      f.type === 'image/heif' ||
      f.name.toLowerCase().endsWith('.heic')
    ) {
      try {
        const heic2any = (await import('heic2any')).default
        blob = (await heic2any({ blob: f, toType: 'image/jpeg', quality: 0.9 })) as Blob
      } catch {
        toast.show('HEIC konverze selhala', 'error')
        return
      }
    }

    setFile(new File([blob], f.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' }))
    setPreview(URL.createObjectURL(blob))
  }

  const handleUpload = async () => {
    if (!file) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('pose', pose)
      formData.append('takenAt', takenAt)

      const res = await fetch('/api/photos', { method: 'POST', body: formData })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? `${res.status}`)
      }
      const body = await res.json()
      notifyXp(body)
      toast.show(`+${body.xpDelta} XP`, 'success')
      resetForm()
      onUploaded()
    } catch {
      toast.show('Upload selhal', 'error')
    } finally {
      setUploading(false)
    }
  }

  const resetForm = () => {
    setFile(null)
    setPreview(null)
    setPose('front')
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title="Nahrát fotku">
      <div className="flex flex-col gap-3">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFile}
          className="text-muted file:bg-border file:text-foreground text-sm file:mr-2 file:rounded file:border-0 file:px-3 file:py-1.5 file:text-sm"
        />
        {preview ? (
          // next/image does not support blob: / data: URLs used for client-side
          // previews before upload. Native <img> is intentional here.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Preview" className="mx-auto h-48 rounded-lg object-contain" />
        ) : null}
        <div className="flex gap-2">
          {POSES.map((p) => (
            <button
              key={p.value}
              onClick={() => setPose(p.value)}
              className={
                'flex-1 rounded-md px-2 py-1.5 text-sm transition-colors ' +
                (pose === p.value
                  ? 'bg-primary text-background font-semibold'
                  : 'bg-border text-muted')
              }
            >
              {p.label}
            </button>
          ))}
        </div>
        <input
          type="date"
          value={takenAt}
          onChange={(e) => setTakenAt(e.target.value)}
          className="border-border bg-surface text-foreground rounded-lg border px-3 py-2 text-sm outline-none"
        />
        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="bg-primary text-background flex h-12 items-center justify-center rounded-lg font-semibold disabled:opacity-50"
        >
          {uploading ? 'Nahrávám…' : 'Nahrát'}
        </button>
      </div>
    </BottomSheet>
  )
}
