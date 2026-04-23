import type { ReactNode } from 'react'
import Image from 'next/image'
import { cn } from '@/components/ui/utils/cn'

type Height = 'sm' | 'md' | 'lg'
type Overlay = 'dark' | 'gradient' | 'none'

type Props = {
  imageSrc?: string
  imageAlt?: string
  overlay?: Overlay
  height?: Height
  className?: string
  children: ReactNode
}

const HEIGHT_CLASS: Record<Height, string> = {
  sm: 'h-32',
  md: 'h-48',
  lg: 'h-64',
}

const BASE =
  'relative w-full overflow-hidden bg-gradient-to-br from-surface-raised via-surface to-background'

const OVERLAY_CLASS: Record<Exclude<Overlay, 'none'>, string> = {
  gradient: 'absolute inset-0 bg-gradient-to-t from-background/90 via-background/40 to-transparent',
  dark: 'absolute inset-0 bg-background/60',
}

export function HeroBanner({
  imageSrc,
  imageAlt = '',
  overlay = 'gradient',
  height = 'md',
  className,
  children,
}: Props) {
  return (
    <section role="region" className={cn(BASE, HEIGHT_CLASS[height], className)}>
      {imageSrc && (
        <Image src={imageSrc} alt={imageAlt} fill sizes="100vw" className="object-cover" priority />
      )}
      {overlay !== 'none' && (
        <div data-hero-overlay={overlay} className={OVERLAY_CLASS[overlay]} aria-hidden />
      )}
      <div className="relative z-10 flex h-full w-full items-end p-4">{children}</div>
    </section>
  )
}
