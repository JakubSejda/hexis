import type { HTMLAttributes } from 'react'

type Props = { label?: string } & HTMLAttributes<HTMLElement>

export function Divider({ label, className, ...rest }: Props) {
  if (!label) {
    return <hr className={['border-border', className].filter(Boolean).join(' ')} {...rest} />
  }
  return (
    <div
      className={['text-muted flex items-center gap-3', className].filter(Boolean).join(' ')}
      role="separator"
      aria-label={label}
    >
      <span className="bg-border h-px flex-1" />
      <span className="text-xs tracking-wider uppercase">{label}</span>
      <span className="bg-border h-px flex-1" />
    </div>
  )
}
