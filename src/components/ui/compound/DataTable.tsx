import type { ReactNode } from 'react'
import { cn } from '../utils/cn'

type Align = 'left' | 'right' | 'center'

export type DataTableColumn<T> = {
  key: string
  header?: string
  align?: Align
  render: (row: T) => ReactNode
  headerClassName?: string
  cellClassName?: string
}

type Props<T> = {
  columns: DataTableColumn<T>[]
  data: T[]
  getRowKey: (row: T, idx: number) => string | number
  className?: string
  empty?: ReactNode
}

const ALIGN: Record<Align, string> = {
  left: 'text-left',
  right: 'text-right',
  center: 'text-center',
}

export function DataTable<T>({ columns, data, getRowKey, className, empty }: Props<T>) {
  const hasHeaders = columns.some((c) => c.header !== undefined)
  const showEmpty = data.length === 0 && empty !== undefined
  return (
    <table className={cn('w-full border-collapse text-sm', className)}>
      {hasHeaders && (
        <thead>
          <tr className="border-border border-b">
            {columns.map((c) => (
              <th
                key={c.key}
                className={cn(
                  'text-muted px-1.5 py-2 text-[11px] font-medium',
                  ALIGN[c.align ?? 'left'],
                  c.headerClassName
                )}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
      )}
      {showEmpty ? (
        <caption className="text-muted caption-bottom py-4 text-sm">{empty}</caption>
      ) : (
        <tbody>
          {data.map((row, idx) => (
            <tr key={getRowKey(row, idx)} className="border-border border-b last:border-0">
              {columns.map((c) => (
                <td
                  key={c.key}
                  className={cn('px-1.5 py-2', ALIGN[c.align ?? 'left'], c.cellClassName)}
                >
                  {c.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      )}
    </table>
  )
}
