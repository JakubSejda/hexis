// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Accordion } from '@/components/ui'

describe('Accordion', () => {
  it('renders triggers with collapsed content by default (type=single)', () => {
    render(
      <Accordion.Root type="single" collapsible>
        <Accordion.Item value="a">
          <Accordion.Trigger>A</Accordion.Trigger>
          <Accordion.Content>Body A</Accordion.Content>
        </Accordion.Item>
      </Accordion.Root>
    )
    expect(screen.getByRole('button', { name: 'A' })).toBeInTheDocument()
    expect(screen.queryByText('Body A')).toBeNull()
  })

  it('expands content when trigger is clicked', async () => {
    render(
      <Accordion.Root type="single" collapsible>
        <Accordion.Item value="a">
          <Accordion.Trigger>A</Accordion.Trigger>
          <Accordion.Content>Body A</Accordion.Content>
        </Accordion.Item>
      </Accordion.Root>
    )
    await userEvent.click(screen.getByRole('button', { name: 'A' }))
    expect(await screen.findByText('Body A')).toBeInTheDocument()
  })

  it('collapses previously-open item when switching (type=single)', async () => {
    render(
      <Accordion.Root type="single" collapsible>
        <Accordion.Item value="a">
          <Accordion.Trigger>A</Accordion.Trigger>
          <Accordion.Content>Body A</Accordion.Content>
        </Accordion.Item>
        <Accordion.Item value="b">
          <Accordion.Trigger>B</Accordion.Trigger>
          <Accordion.Content>Body B</Accordion.Content>
        </Accordion.Item>
      </Accordion.Root>
    )
    await userEvent.click(screen.getByRole('button', { name: 'A' }))
    await screen.findByText('Body A')
    await userEvent.click(screen.getByRole('button', { name: 'B' }))
    await screen.findByText('Body B')
    expect(screen.queryByText('Body A')).toBeNull()
  })

  it('honours defaultValue on initial render', () => {
    render(
      <Accordion.Root type="single" collapsible defaultValue="a">
        <Accordion.Item value="a">
          <Accordion.Trigger>A</Accordion.Trigger>
          <Accordion.Content>Body A</Accordion.Content>
        </Accordion.Item>
      </Accordion.Root>
    )
    expect(screen.getByText('Body A')).toBeInTheDocument()
  })
})
