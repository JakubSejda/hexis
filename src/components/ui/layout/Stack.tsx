import type { ElementType, ReactNode, HTMLAttributes } from 'react'

type Gap = 2 | 3 | 4 | 6 | 8

const GAP_CLASS: Record<Gap, string> = {
  2: 'gap-2',
  3: 'gap-3',
  4: 'gap-4',
  6: 'gap-6',
  8: 'gap-8',
}

type Props = {
  as?: ElementType
  gap?: Gap
  children: ReactNode
} & HTMLAttributes<HTMLElement>

export function Stack({ as: As = 'div', gap = 4, className, children, ...rest }: Props) {
  return (
    <As
      className={['flex flex-col', GAP_CLASS[gap], className].filter(Boolean).join(' ')}
      {...rest}
    >
      {children}
    </As>
  )
}
