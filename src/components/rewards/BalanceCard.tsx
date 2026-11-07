import { Card } from '@/components/ui'
import type { RewardsBalance } from '@/lib/queries/rewards'

type Props = {
  balance: RewardsBalance
  className?: string
}

export function BalanceCard({ balance, className }: Props) {
  return (
    <Card padding="md" className={className}>
      <div className="text-muted text-xs font-semibold tracking-[0.12em] uppercase">K utracení</div>
      <div
        data-testid="rewards-balance"
        className="text-accent font-display mt-1 text-3xl font-bold"
      >
        {balance.balanceXp} XP
      </div>
      <div className="text-muted mt-3 flex justify-between text-xs">
        <span>
          Získáno{' '}
          <span className="text-foreground font-display font-semibold">{balance.totalXp}</span>
        </span>
        <span>
          Utraceno{' '}
          <span className="text-foreground font-display font-semibold">{balance.spentXp}</span>
        </span>
      </div>
    </Card>
  )
}
