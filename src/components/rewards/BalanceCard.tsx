import { Card } from '@/components/ui'
import type { RewardsBalance } from '@/lib/queries/rewards'

type Props = {
  balance: RewardsBalance
  className?: string
}

export function BalanceCard({ balance, className }: Props) {
  return (
    <Card padding="md" className={className}>
      <div className="text-muted font-mono text-xs tracking-[0.2em] uppercase">K utracení</div>
      <div data-testid="rewards-balance" className="text-accent mt-1 font-mono text-3xl font-bold">
        {balance.balanceXp} XP
      </div>
      <div className="text-muted mt-3 flex justify-between text-xs">
        <span>
          Získáno <span className="text-foreground font-mono font-semibold">{balance.totalXp}</span>
        </span>
        <span>
          Utraceno{' '}
          <span className="text-foreground font-mono font-semibold">{balance.spentXp}</span>
        </span>
      </div>
    </Card>
  )
}
