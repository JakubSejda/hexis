import Link from 'next/link'
import { Gift } from 'lucide-react'
import { Card } from '@/components/ui'

type Props = {
  balanceXp: number
  totalXp: number
  spentXp: number
}

export function RewardsBalanceCard({ balanceXp, totalXp, spentXp }: Props) {
  return (
    <Card as={Link} href="/rewards" aria-label="Odměny" variant="interactive" className="block">
      <div className="flex items-center gap-3">
        <Gift className="text-accent h-5 w-5 shrink-0" aria-hidden />
        <div className="min-w-0 flex-1">
          <div className="text-muted text-xs tracking-[0.3em] uppercase">K utracení</div>
          <div
            data-testid="rewards-balance-card-amount"
            className="text-foreground text-xl font-bold"
          >
            {balanceXp} XP
          </div>
        </div>
        <div className="text-muted text-right text-xs">
          <div>{totalXp} získáno</div>
          <div>{spentXp} utraceno</div>
        </div>
      </div>
    </Card>
  )
}
