import { Tooltip } from '@/components/ui'

type Props = {
  weeksSincePr: number
  suggestion: 'deload' | 'variation'
}

export function StagnationBadge({ weeksSincePr, suggestion }: Props) {
  const hint =
    suggestion === 'deload'
      ? `${weeksSincePr} t. bez PR — zkus deload`
      : `${weeksSincePr} t. bez PR — zkus variantu`
  return (
    <Tooltip content={hint}>
      <span
        tabIndex={0}
        className="bg-accent/10 text-accent focus-visible:ring-ring inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs focus-visible:ring-2 focus-visible:outline-none"
      >
        ⚠ {weeksSincePr}t. bez PR
      </span>
    </Tooltip>
  )
}
