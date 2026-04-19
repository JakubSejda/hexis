type Props = {
  weeksSincePr: number
  suggestion: 'deload' | 'variation'
}

export function StagnationBadge({ weeksSincePr, suggestion }: Props) {
  return (
    <span
      className="bg-accent/10 text-accent inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs"
      title={
        suggestion === 'deload'
          ? `${weeksSincePr} t. bez PR — zkus deload`
          : `${weeksSincePr} t. bez PR — zkus variantu`
      }
    >
      ⚠ {weeksSincePr}t. bez PR
    </span>
  )
}
