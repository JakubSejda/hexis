import type { ElementType, ReactNode, HTMLAttributes } from 'react'

type Size = 'sm' | 'md' | 'lg'

const SIZE_CLASS: Record<Size, string> = {
  sm: 'max-w-md',
  md: 'max-w-2xl',
  lg: 'max-w-4xl',
}

type Props = {
  as?: ElementType
  size?: Size
  children: ReactNode
} & HTMLAttributes<HTMLElement>

export function Container({ as: As = 'div', size = 'md', className, children, ...rest }: Props) {
  return (
    <As
      className={['mx-auto w-full px-4', SIZE_CLASS[size], className].filter(Boolean).join(' ')}
      {...rest}
    >
      {children}
    </As>
  )
}
