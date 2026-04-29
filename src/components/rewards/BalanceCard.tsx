import type { RewardsBalance } from '@/lib/queries/rewards'

type Props = {
  balance: RewardsBalance
  className?: string
}

export function BalanceCard({ balance, className }: Props) {
  return (
    <div className={'border-border bg-surface rounded-2xl border p-4 ' + (className ?? '')}>
      <div className="text-muted text-xs tracking-[0.3em] uppercase">K utracení</div>
      <div data-testid="rewards-balance" className="text-accent mt-1 text-3xl font-bold">
        {balance.balanceXp} XP
      </div>
      <div className="text-muted mt-3 flex justify-between text-xs">
        <span>
          Získáno <span className="text-foreground font-semibold">{balance.totalXp}</span>
        </span>
        <span>
          Utraceno <span className="text-foreground font-semibold">{balance.spentXp}</span>
        </span>
      </div>
    </div>
  )
}
