import Link from 'next/link'
import type { ReactNode } from 'react'
import { cn } from '@/components/ui'

type Props = {
  label: string
  value: string
  secondary: string
  visual: ReactNode
  href: string
  empty: boolean
}

export function LifeAreaCard({ label, value, secondary, visual, href, empty }: Props) {
  return (
    <Link
      href={href}
      className={cn(
        'border-border bg-surface hover:border-accent block rounded-xl border p-4 shadow-md transition-all hover:shadow-lg',
        empty && 'opacity-60'
      )}
    >
      <div className="text-muted text-xs font-medium tracking-[0.2em] uppercase">{label}</div>
      <div className="text-foreground mt-1 text-xl font-bold sm:text-2xl">{value}</div>
      <div className="text-muted mt-0.5 text-xs">{secondary}</div>
      {visual && <div className="mt-3">{visual}</div>}
    </Link>
  )
}
