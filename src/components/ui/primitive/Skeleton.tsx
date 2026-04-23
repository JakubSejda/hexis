import type { CSSProperties, HTMLAttributes } from 'react'
import { cn } from '../utils/cn'

type Shape = 'text' | 'block' | 'avatar' | 'card'

const SHAPE_CLASS: Record<Shape, string> = {
  text: 'h-4 rounded',
  block: 'h-20 rounded-md',
  avatar: 'h-10 w-10 rounded-full',
  card: 'h-32 rounded-2xl',
}

type Props = {
  shape?: Shape
  lines?: number
  width?: string | number
  height?: string | number
  className?: string
} & Omit<HTMLAttributes<HTMLDivElement>, 'className'>

export function Skeleton({ shape = 'text', lines = 1, width, height, className, ...rest }: Props) {
  const base = 'animate-pulse bg-surface-raised'
  const widthClass = typeof width === 'string' ? width : undefined
  const style: CSSProperties = {
    ...(typeof width === 'number' ? { width: `${width}px` } : null),
    ...(typeof height === 'number' ? { height: `${height}px` } : null),
  }

  if (shape === 'text' && lines > 1) {
    return (
      <div className={cn('flex flex-col gap-2', className)} {...rest}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            data-testid="skeleton-line"
            className={cn(base, SHAPE_CLASS.text, widthClass)}
            style={style}
          />
        ))}
      </div>
    )
  }

  return (
    <div className={cn(base, SHAPE_CLASS[shape], widthClass, className)} style={style} {...rest} />
  )
}
