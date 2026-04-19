import type { ReactNode, HTMLAttributes } from 'react'

type Cols = 1 | 2 | 3 | 4
type Gap = 2 | 3 | 4 | 6 | 8

const COL_CLASS: Record<Cols, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
}
const SM_COL_CLASS: Record<Cols, string> = {
  1: 'sm:grid-cols-1',
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-3',
  4: 'sm:grid-cols-4',
}
const MD_COL_CLASS: Record<Cols, string> = {
  1: 'md:grid-cols-1',
  2: 'md:grid-cols-2',
  3: 'md:grid-cols-3',
  4: 'md:grid-cols-4',
}
const LG_COL_CLASS: Record<Cols, string> = {
  1: 'lg:grid-cols-1',
  2: 'lg:grid-cols-2',
  3: 'lg:grid-cols-3',
  4: 'lg:grid-cols-4',
}
const GAP_CLASS: Record<Gap, string> = {
  2: 'gap-2',
  3: 'gap-3',
  4: 'gap-4',
  6: 'gap-6',
  8: 'gap-8',
}

type Props = {
  cols?: Cols
  gap?: Gap
  responsive?: { sm?: Cols; md?: Cols; lg?: Cols }
  children: ReactNode
} & HTMLAttributes<HTMLDivElement>

export function Grid({ cols = 2, gap = 4, responsive, className, children, ...rest }: Props) {
  const classes = [
    'grid',
    COL_CLASS[cols],
    GAP_CLASS[gap],
    responsive?.sm ? SM_COL_CLASS[responsive.sm] : '',
    responsive?.md ? MD_COL_CLASS[responsive.md] : '',
    responsive?.lg ? LG_COL_CLASS[responsive.lg] : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ')
  return (
    <div className={classes} {...rest}>
      {children}
    </div>
  )
}
