import Link from 'next/link'
import type { ReactNode } from 'react'
import { Card, cn } from '@/components/ui'

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
    <Card
      as={Link}
      href={href}
      variant="interactive"
      className={cn('animate-hud-power-on block', empty && 'opacity-60')}
    >
      <div className="text-muted font-mono text-xs font-medium tracking-[0.2em] uppercase">
        {label}
      </div>
      <div className="text-foreground mt-1 text-xl font-bold sm:text-2xl">{value}</div>
      <div className="text-muted mt-0.5 text-xs">{secondary}</div>
      {visual && <div className="mt-3">{visual}</div>}
    </Card>
  )
}
