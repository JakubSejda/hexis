type Props = { children: string; className?: string }

export function RegionHeader({ children, className }: Props) {
  return (
    <div
      className={
        'text-muted px-1 pb-2 text-[10px] font-medium tracking-[0.2em] uppercase ' +
        (className ?? '')
      }
    >
      {children}
    </div>
  )
}
