type Props = {
  weeksSincePr: number
  suggestion: 'deload' | 'variation'
}

export function StagnationBadge({ weeksSincePr, suggestion }: Props) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-md bg-[#f59e0b]/10 px-2 py-0.5 text-xs text-[#f59e0b]"
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
