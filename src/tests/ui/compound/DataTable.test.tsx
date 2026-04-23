// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DataTable } from '@/components/ui/compound/DataTable'

type Row = { id: number; name: string; count: number }
const rows: Row[] = [
  { id: 1, name: 'Alpha', count: 3 },
  { id: 2, name: 'Beta', count: 7 },
]

describe('DataTable', () => {
  it('renders one <tr> in tbody per row', () => {
    const { container } = render(
      <DataTable
        columns={[
          { key: 'name', render: (r: Row) => r.name },
          { key: 'count', render: (r: Row) => r.count },
        ]}
        data={rows}
        getRowKey={(r) => r.id}
      />
    )
    const bodyRows = container.querySelectorAll('tbody tr')
    expect(bodyRows.length).toBe(2)
  })

  it('renders each column render() output in the correct cell', () => {
    render(
      <DataTable
        columns={[
          { key: 'name', render: (r: Row) => r.name },
          { key: 'count', render: (r: Row) => `${r.count}×` },
        ]}
        data={rows}
        getRowKey={(r) => r.id}
      />
    )
    expect(screen.getByText('Alpha')).toBeInTheDocument()
    expect(screen.getByText('3×')).toBeInTheDocument()
    expect(screen.getByText('Beta')).toBeInTheDocument()
    expect(screen.getByText('7×')).toBeInTheDocument()
  })

  it('omits <thead> when no column has a header', () => {
    const { container } = render(
      <DataTable
        columns={[
          { key: 'name', render: (r: Row) => r.name },
          { key: 'count', render: (r: Row) => r.count },
        ]}
        data={rows}
        getRowKey={(r) => r.id}
      />
    )
    expect(container.querySelector('thead')).toBeNull()
  })

  it('renders <thead> when at least one column has a header', () => {
    render(
      <DataTable
        columns={[
          { key: 'name', header: 'Name', render: (r: Row) => r.name },
          { key: 'count', header: 'Count', render: (r: Row) => r.count },
        ]}
        data={rows}
        getRowKey={(r) => r.id}
      />
    )
    expect(screen.getByRole('columnheader', { name: 'Name' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Count' })).toBeInTheDocument()
  })

  it('applies align="right" class to the column cells', () => {
    const { container } = render(
      <DataTable
        columns={[
          { key: 'name', render: (r: Row) => r.name },
          { key: 'count', align: 'right', render: (r: Row) => r.count },
        ]}
        data={rows}
        getRowKey={(r) => r.id}
      />
    )
    const cells = container.querySelectorAll('tbody tr:first-child td')
    expect(cells[1]?.className).toContain('text-right')
    expect(cells[0]?.className).not.toContain('text-right')
  })

  it('renders the empty slot when data is empty and empty is provided', () => {
    const { container } = render(
      <DataTable
        columns={[{ key: 'name', render: (r: Row) => r.name }]}
        data={[]}
        getRowKey={(r) => r.id}
        empty={<p>Žádná data.</p>}
      />
    )
    expect(screen.getByText('Žádná data.')).toBeInTheDocument()
    expect(container.querySelector('tbody')).toBeNull()
  })

  it('uses getRowKey for stable keys', () => {
    const dupe: Row[] = [
      { id: 1, name: 'Same', count: 1 },
      { id: 2, name: 'Same', count: 2 },
    ]
    const { container } = render(
      <DataTable
        columns={[
          { key: 'name', render: (r: Row) => r.name },
          { key: 'count', render: (r: Row) => r.count },
        ]}
        data={dupe}
        getRowKey={(r) => r.id}
      />
    )
    expect(container.querySelectorAll('tbody tr').length).toBe(2)
  })
})
