// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HabitDialog } from '@/components/habits/HabitDialog'

afterEach(cleanup)

describe('HabitDialog (create mode)', () => {
  it('renders create title and disabled weeklyTarget when cadence=daily', () => {
    render(<HabitDialog open mode="create" onClose={vi.fn()} onSubmit={vi.fn()} />)
    expect(screen.getByText(/nový návyk/i)).toBeInTheDocument()
    expect(screen.queryByLabelText(/×\/týden/i)).not.toBeInTheDocument()
  })

  it('shows weeklyTarget input when cadence=weekly is selected', async () => {
    render(<HabitDialog open mode="create" onClose={vi.fn()} onSubmit={vi.fn()} />)
    await userEvent.click(screen.getByRole('radio', { name: /weekly/i }))
    expect(screen.getByLabelText(/×\/týden/i)).toBeInTheDocument()
  })

  it('updates the XP info text when weight changes', async () => {
    render(<HabitDialog open mode="create" onClose={vi.fn()} onSubmit={vi.fn()} />)
    expect(screen.getByText(/50 \/ 200 \/ 1000 XP/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('radio', { name: /heavy/i }))
    expect(screen.getByText(/100 \/ 400 \/ 2000 XP/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('radio', { name: /light/i }))
    expect(screen.getByText(/25 \/ 100 \/ 500 XP/)).toBeInTheDocument()
  })

  it('submits a valid daily habit', async () => {
    const onSubmit = vi.fn()
    render(<HabitDialog open mode="create" onClose={vi.fn()} onSubmit={onSubmit} />)
    await userEvent.type(screen.getByLabelText(/název návyku/i), 'Voda')
    await userEvent.click(screen.getByRole('button', { name: /vytvořit/i }))
    expect(onSubmit).toHaveBeenCalledWith({
      name: 'Voda',
      cadence: 'daily',
      weeklyTarget: undefined,
      weight: 'standard',
    })
  })

  it('submits a valid weekly habit with target', async () => {
    const onSubmit = vi.fn()
    render(<HabitDialog open mode="create" onClose={vi.fn()} onSubmit={onSubmit} />)
    await userEvent.type(screen.getByLabelText(/název návyku/i), 'Meditace')
    await userEvent.click(screen.getByRole('radio', { name: /weekly/i }))
    const target = screen.getByLabelText(/×\/týden/i)
    await userEvent.clear(target)
    await userEvent.type(target, '4')
    await userEvent.click(screen.getByRole('button', { name: /vytvořit/i }))
    expect(onSubmit).toHaveBeenCalledWith({
      name: 'Meditace',
      cadence: 'weekly',
      weeklyTarget: 4,
      weight: 'standard',
    })
  })
})

describe('HabitDialog (edit mode)', () => {
  const habit = {
    id: 1,
    name: 'Voda',
    cadence: 'daily' as const,
    weeklyTarget: null,
    weight: 'standard' as const,
  }

  it('renders Upravit title + immutable cadence note', () => {
    render(<HabitDialog open mode="edit" habit={habit} onClose={vi.fn()} onSubmit={vi.fn()} />)
    expect(screen.getByText(/upravit návyk/i)).toBeInTheDocument()
    expect(screen.getByText(/cadence nelze měnit/i)).toBeInTheDocument()
  })

  it('disables cadence radios in edit mode', () => {
    render(<HabitDialog open mode="edit" habit={habit} onClose={vi.fn()} onSubmit={vi.fn()} />)
    expect(screen.getByRole('radio', { name: /daily/i })).toBeDisabled()
    expect(screen.getByRole('radio', { name: /weekly/i })).toBeDisabled()
  })

  it('submits only mutable fields (name + weight)', async () => {
    const onSubmit = vi.fn()
    render(<HabitDialog open mode="edit" habit={habit} onClose={vi.fn()} onSubmit={onSubmit} />)
    const nameInput = screen.getByLabelText(/název návyku/i)
    await userEvent.clear(nameInput)
    await userEvent.type(nameInput, 'Voda 2L')
    await userEvent.click(screen.getByRole('radio', { name: /heavy/i }))
    await userEvent.click(screen.getByRole('button', { name: /uložit/i }))
    expect(onSubmit).toHaveBeenCalledWith({ name: 'Voda 2L', weight: 'heavy' })
  })
})
