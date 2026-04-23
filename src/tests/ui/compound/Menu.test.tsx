// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Menu } from '@/components/ui/compound/Menu'

describe('Menu', () => {
  it('does not render items until trigger is clicked', () => {
    render(
      <Menu.Root>
        <Menu.Trigger>Open</Menu.Trigger>
        <Menu.Content>
          <Menu.Item onSelect={() => {}}>A</Menu.Item>
        </Menu.Content>
      </Menu.Root>
    )
    expect(screen.queryByText('A')).toBeNull()
  })

  it('opens menu and shows items on trigger click', async () => {
    render(
      <Menu.Root>
        <Menu.Trigger>Open</Menu.Trigger>
        <Menu.Content>
          <Menu.Item onSelect={() => {}}>Upravit</Menu.Item>
          <Menu.Item onSelect={() => {}}>Smazat</Menu.Item>
        </Menu.Content>
      </Menu.Root>
    )
    await userEvent.click(screen.getByRole('button', { name: 'Open' }))
    expect(await screen.findByRole('menuitem', { name: 'Upravit' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Smazat' })).toBeInTheDocument()
  })

  it('fires onSelect and closes when an item is clicked', async () => {
    const onEdit = vi.fn()
    render(
      <Menu.Root>
        <Menu.Trigger>Open</Menu.Trigger>
        <Menu.Content>
          <Menu.Item onSelect={onEdit}>Upravit</Menu.Item>
        </Menu.Content>
      </Menu.Root>
    )
    await userEvent.click(screen.getByRole('button', { name: 'Open' }))
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Upravit' }))
    expect(onEdit).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('menuitem')).toBeNull()
  })

  it('applies danger styling via variant="danger" className', async () => {
    render(
      <Menu.Root>
        <Menu.Trigger>Open</Menu.Trigger>
        <Menu.Content>
          <Menu.Item onSelect={() => {}} variant="danger">
            Smazat
          </Menu.Item>
        </Menu.Content>
      </Menu.Root>
    )
    await userEvent.click(screen.getByRole('button', { name: 'Open' }))
    const item = await screen.findByRole('menuitem', { name: 'Smazat' })
    expect(item.className).toContain('text-danger')
  })
})
