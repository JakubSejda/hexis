import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { cn } from '../utils/cn'

type BreadcrumbItem = { label: string; href?: string }

type Props = {
  items: BreadcrumbItem[]
  className?: string
}

export function Breadcrumb({ items, className }: Props) {
  return (
    <nav aria-label="Breadcrumb" className={cn('text-sm', className)}>
      <ol className="text-muted flex flex-wrap items-center gap-1.5">
        {items.map((item, i) => {
          const isLast = i === items.length - 1
          return (
            <li key={`${item.label}-${i}`} className="flex items-center gap-1.5">
              {isLast ? (
                <span aria-current="page" className="text-foreground font-medium">
                  {item.label}
                </span>
              ) : item.href ? (
                <Link href={item.href} className="hover:text-foreground transition-colors">
                  {item.label}
                </Link>
              ) : (
                <span>{item.label}</span>
              )}
              {!isLast && (
                <ChevronRight
                  size={14}
                  data-breadcrumb-separator
                  className="text-muted/60"
                  aria-hidden
                />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
