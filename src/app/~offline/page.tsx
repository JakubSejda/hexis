import type { Metadata } from 'next'
import Image from 'next/image'
import { Heading } from '@/components/ui'

export const metadata: Metadata = { title: 'Hexis — offline' }

const SHELL = 'flex min-h-screen flex-col items-center justify-center gap-5 p-6 text-center'

/** Served by the service worker when a page cannot be reached without a network. */
export default function OfflinePage() {
  return (
    <main id="main" className={SHELL}>
      <div className="rounded-card relative h-48 w-48 overflow-hidden">
        <Image
          src="/images/player-portrait.svg"
          alt=""
          fill
          unoptimized
          sizes="192px"
          className="object-cover"
        />
      </div>
      <Heading level={1} variant="display" className="text-3xl">
        Jsi offline
      </Heading>
      <p className="text-muted max-w-xs text-sm">
        Systém teď nedosáhne na server. Zapsané série už jsou uložené — jakmile bude signál, stačí
        stránku obnovit.
      </p>
    </main>
  )
}
