# DataTable

Generic thin `<table>` wrapper. No sorting or pagination — consumer's problem.

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `columns` | `DataTableColumn<T>[]` | required | Ordered column definitions. |
| `data` | `T[]` | required | Row objects. |
| `getRowKey` | `(row: T, idx: number) => string \| number` | required | Stable row keys. |
| `empty` | `ReactNode` | — | Rendered (as `<caption>`) when `data.length === 0`. |
| `className` | `string` | — | Merged onto `<table>`. |

## `DataTableColumn<T>`

| Prop | Type | Description |
|---|---|---|
| `key` | `string` | React key + stable id. |
| `header` | `string?` | Column header; `<thead>` omitted when no column has one. |
| `align` | `'left' \| 'right' \| 'center'` | Alignment on both header + cell. |
| `render` | `(row: T) => ReactNode` | Cell content. |
| `headerClassName` | `string?` | Extra classes on `<th>`. |
| `cellClassName` | `string?` | Extra classes on each `<td>`. |

## Example

### XP rollup

```tsx
import { DataTable, type DataTableColumn } from '@/components/ui'

type Row = { event: string; xp: number; count: number }

const columns: DataTableColumn<Row>[] = [
  { key: 'event', render: (r) => LABELS[r.event] ?? r.event, cellClassName: 'py-2' },
  { key: 'count', align: 'right', render: (r) => `${r.count}×`, cellClassName: 'text-muted py-2' },
  { key: 'xp', align: 'right', render: (r) => `${r.xp.toLocaleString('cs-CZ')} XP`, cellClassName: 'font-semibold py-2' },
]

<DataTable
  columns={columns}
  data={rows}
  getRowKey={(r) => r.event}
  empty={<span>Zatím žádná aktivita.</span>}
/>
```

## Do / Don't

- Use DataTable for static read-only tables where each column's formatting is simple
- Omit `header` on all columns for a headless lookup-style table
- Don't force DataTable onto tables with editable cells + spanned rows — build custom
- Don't put sort/pagination logic inside DataTable — own it in the consumer
