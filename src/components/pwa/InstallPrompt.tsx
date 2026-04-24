'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISSED_KEY = 'hexis:pwa-install-dismissed'

export function InstallPrompt() {
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem(DISMISSED_KEY) === 'true'
  })
  const [show, setShow] = useState(false)
  const [isIos, setIsIos] = useState(false)
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    if (dismissed) return
    if (window.matchMedia('(display-mode: standalone)').matches) return

    const ua = navigator.userAgent
    const isIosDevice =
      /iPad|iPhone|iPod/.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream
    if (isIosDevice && !(navigator as unknown as { standalone?: boolean }).standalone) {
      // Defer state updates off the synchronous effect path to avoid
      // react-hooks/set-state-in-effect cascading re-renders.
      queueMicrotask(() => {
        setIsIos(true)
        setShow(true)
      })
      return
    }

    const handler = (e: Event) => {
      e.preventDefault()
      deferredPrompt.current = e as BeforeInstallPromptEvent
      setShow(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [dismissed])

  const handleInstall = async () => {
    if (deferredPrompt.current) {
      await deferredPrompt.current.prompt()
      const { outcome } = await deferredPrompt.current.userChoice
      if (outcome === 'accepted') setShow(false)
      deferredPrompt.current = null
    }
  }

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, 'true')
    setDismissed(true)
    setShow(false)
  }

  if (dismissed || !show) return null

  return (
    <div className="border-border bg-surface fixed right-0 bottom-16 left-0 z-40 border-t px-4 py-3">
      <div className="flex items-center justify-between">
        <p className="text-foreground text-sm">
          {isIos ? 'Otevři Share → Přidat na plochu' : 'Přidej Hexis na plochu'}
        </p>
        <div className="flex gap-2">
          {!isIos ? (
            <Button variant="success" size="sm" onClick={handleInstall}>
              Přidat
            </Button>
          ) : null}
          <Button variant="ghost" size="sm" onClick={handleDismiss}>
            Zavřít
          </Button>
        </div>
      </div>
    </div>
  )
}
