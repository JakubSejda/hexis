import type { ReactNode, HTMLAttributes } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/components/ui/utils/cn'
import { Heading } from '@/components/ui/primitive/Heading'

type Props = {
  icon: LucideIcon
  title: string
  description?: string
  action?: ReactNode
  className?: string
} & Omit<HTMLAttributes<HTMLDivElement>, 'className'>

export function EmptyState({ icon: Icon, title, description, action, className, ...rest }: Props) {
  return (
    <div
      className={cn('flex flex-col items-center justify-center gap-3 py-10 text-center', className)}
      {...rest}
    >
      <Icon size={64} className="text-muted" />
      <Heading level={2}>{title}</Heading>
      {description ? <p className="text-muted max-w-sm text-sm">{description}</p> : null}
      {action ? <div className="pt-1">{action}</div> : null}
    </div>
  )
}
