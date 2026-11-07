import Link from 'next/link'
import type { ComponentType, ReactNode, SVGProps } from 'react'
import { cn } from '../utils/cn'

type Variant = 'side' | 'bottom'

const BASE: Record<Variant, string> = {
  side: 'flex items-center gap-2.5 px-4 py-2 text-sm transition-colors',
  bottom:
    'flex flex-1 flex-col items-center justify-center gap-0.5 rounded-control text-[11px] font-semibold transition-colors',
}

const ACTIVE: Record<Variant, string> = {
  side: 'bg-accent text-accent-foreground rounded-control font-semibold',
  bottom: 'bg-accent text-accent-foreground',
}

const INACTIVE: Record<Variant, string> = {
  side: 'text-muted rounded-control hover:bg-surface hover:text-foreground',
  bottom: 'text-muted hover:text-foreground',
}

const ICON: Record<Variant, string> = { side: 'h-4 w-4', bottom: 'h-5 w-5' }

type Props = {
  href: string
  active: boolean
  variant: Variant
  icon: ComponentType<SVGProps<SVGSVGElement>>
  children: ReactNode
  className?: string
}

export function NavLink({ href, active, variant, icon: Icon, children, className }: Props) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={cn(BASE[variant], active ? ACTIVE[variant] : INACTIVE[variant], className)}
    >
      <Icon className={ICON[variant]} aria-hidden />
      <span>{children}</span>
    </Link>
  )
}
