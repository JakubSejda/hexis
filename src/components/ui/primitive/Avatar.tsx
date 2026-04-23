import type { ReactNode, HTMLAttributes, ImgHTMLAttributes } from 'react'
import { cn } from '@/components/ui/utils/cn'

type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

const SIZE_CLASS: Record<Size, string> = {
  xs: 'h-6 w-6 text-xs',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-lg',
}

const BASE = 'inline-flex items-center justify-center overflow-hidden rounded-full select-none'

type Props = {
  src?: string
  alt: string
  size?: Size
  fallback?: ReactNode
  className?: string
} & Omit<HTMLAttributes<HTMLElement>, 'className'>

function initialsFromAlt(alt: string): string {
  const parts = alt.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return ''
  if (parts.length === 1) return parts[0]!.charAt(0).toUpperCase()
  return (parts[0]!.charAt(0) + parts[parts.length - 1]!.charAt(0)).toUpperCase()
}

export function Avatar({ src, alt, size = 'md', fallback, className, ...rest }: Props) {
  const classes = cn(BASE, SIZE_CLASS[size], className)

  if (src) {
    const imgRest = rest as ImgHTMLAttributes<HTMLImageElement>
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={alt} className={cn(classes, 'object-cover')} {...imgRest} />
    )
  }

  return (
    <div
      className={cn(classes, 'bg-surface-raised text-muted font-semibold')}
      aria-label={alt}
      role="img"
      {...(rest as HTMLAttributes<HTMLDivElement>)}
    >
      {fallback ?? initialsFromAlt(alt)}
    </div>
  )
}
