import type { ReactNode, HTMLAttributes } from 'react'

type Props = {
  title?: string
  action?: ReactNode
  children: ReactNode
} & HTMLAttributes<HTMLElement>

export function Section({ title, action, className, children, ...rest }: Props) {
  return (
    <section className={['flex flex-col gap-3', className].filter(Boolean).join(' ')} {...rest}>
      {title ? (
        <div className="flex items-end justify-between">
          <h2 className="text-muted font-mono text-xs tracking-[0.2em] uppercase">{title}</h2>
          {action ? <div>{action}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  )
}
