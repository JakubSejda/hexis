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
        'border-border bg-surface hover:border-accent block rounded-xl border p-4 transition-colors',
        empty && 'opacity-60'
      )}
    >
      <div className="text-muted text-[10px] font-medium tracking-[0.2em] uppercase">{label}</div>
      <div className="text-foreground mt-1 text-2xl font-bold">{value}</div>
      <div className="text-muted mt-0.5 text-xs">{secondary}</div>
      {visual && <div className="mt-3">{visual}</div>}
    </Link>
  )
}
