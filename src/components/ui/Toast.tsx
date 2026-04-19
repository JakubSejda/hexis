'use client'
import { createContext, useContext, useState, useCallback } from 'react'

type Toast = { id: number; message: string; tone: 'success' | 'error' | 'info' }
type Ctx = { show: (message: string, tone?: Toast['tone']) => void }

const ToastContext = createContext<Ctx | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const show = useCallback<Ctx['show']>((message, tone = 'info') => {
    const id = Date.now() + Math.random()
    setToasts((t) => [...t, { id, message, tone }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500)
  }, [])
  return (
    <ToastContext value={{ show }}>
      {children}
      <div className="pointer-events-none fixed top-4 left-1/2 z-50 flex -translate-x-1/2 flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto rounded-lg px-4 py-2 text-sm shadow-lg ${
              t.tone === 'success'
                ? 'bg-primary text-background'
                : t.tone === 'error'
                  ? 'bg-danger text-white'
                  : 'border-border bg-surface text-foreground border'
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be inside ToastProvider')
  return ctx
}
