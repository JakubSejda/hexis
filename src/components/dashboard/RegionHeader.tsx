type Props = { children: string; className?: string }

export function RegionHeader({ children, className }: Props) {
  return (
    <div
      className={
        'text-muted flex items-center gap-2 px-1 pb-2 font-mono text-xs font-medium tracking-[0.2em] uppercase ' +
        (className ?? '')
      }
    >
      <span className="whitespace-nowrap">{children}</span>
      <span aria-hidden className="bg-border h-px flex-1" />
    </div>
  )
}
