// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Tabs } from '@/components/ui'

describe('Tabs', () => {
  it('renders default tab content initially', () => {
    render(
      <Tabs.Root defaultValue="one">
        <Tabs.List>
          <Tabs.Trigger value="one">One</Tabs.Trigger>
          <Tabs.Trigger value="two">Two</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="one">Panel one</Tabs.Content>
        <Tabs.Content value="two">Panel two</Tabs.Content>
      </Tabs.Root>
    )
    expect(screen.getByText('Panel one')).toBeInTheDocument()
    expect(screen.queryByText('Panel two')).toBeNull()
  })

  it('switches panel on trigger click', async () => {
    render(
      <Tabs.Root defaultValue="one">
        <Tabs.List>
          <Tabs.Trigger value="one">One</Tabs.Trigger>
          <Tabs.Trigger value="two">Two</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="one">Panel one</Tabs.Content>
        <Tabs.Content value="two">Panel two</Tabs.Content>
      </Tabs.Root>
    )
    await userEvent.click(screen.getByRole('tab', { name: 'Two' }))
    expect(screen.getByText('Panel two')).toBeInTheDocument()
    expect(screen.queryByText('Panel one')).toBeNull()
  })

  it('supports arrow-key navigation', async () => {
    render(
      <Tabs.Root defaultValue="one">
        <Tabs.List>
          <Tabs.Trigger value="one">One</Tabs.Trigger>
          <Tabs.Trigger value="two">Two</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="one">Panel one</Tabs.Content>
        <Tabs.Content value="two">Panel two</Tabs.Content>
      </Tabs.Root>
    )
    await userEvent.tab()
    await userEvent.keyboard('{ArrowRight}')
    expect(screen.getByRole('tab', { name: 'Two' })).toHaveAttribute('aria-selected', 'true')
  })

  it('fires onValueChange when a trigger is activated', async () => {
    const onValueChange = vi.fn()
    render(
      <Tabs.Root defaultValue="one" onValueChange={onValueChange}>
        <Tabs.List>
          <Tabs.Trigger value="one">One</Tabs.Trigger>
          <Tabs.Trigger value="two">Two</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="one">a</Tabs.Content>
        <Tabs.Content value="two">b</Tabs.Content>
      </Tabs.Root>
    )
    await userEvent.click(screen.getByRole('tab', { name: 'Two' }))
    expect(onValueChange).toHaveBeenCalledWith('two')
  })
})
