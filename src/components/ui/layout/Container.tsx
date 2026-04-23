import type { ElementType, ReactNode, HTMLAttributes } from 'react'
import { cn } from '@/components/ui/utils/cn'

type Size = 'sm' | 'md' | 'lg' | 'full'

const SIZE_CLASS: Record<Size, string> = {
  sm: 'max-w-md',
  md: 'max-w-2xl',
  lg: 'max-w-4xl',
  full: 'max-w-none',
}

type Props = {
  as?: ElementType
  size?: Size
  children: ReactNode
} & HTMLAttributes<HTMLElement>

export function Container({ as: As = 'div', size = 'md', className, children, ...rest }: Props) {
  return (
    <As
      className={cn('w-full px-4', size !== 'full' && 'mx-auto', SIZE_CLASS[size], className)}
      {...rest}
    >
      {children}
    </As>
  )
}
