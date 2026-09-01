// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Sparkline } from '@/components/ui'

describe('Sparkline', () => {
  it('renders an empty <svg> when all values are null', () => {
    const { container } = render(<Sparkline values={[null, null, null]} />)
    const svg = container.querySelector('svg')
    expect(svg).toBeTruthy()
    expect(svg?.querySelector('path')).toBeNull()
  })

  it('renders a <path> when at least one value is non-null', () => {
    const { container } = render(<Sparkline values={[1, 2, 3]} />)
    expect(container.querySelector('path')).toBeTruthy()
  })

  it('uses muted tone color by default', () => {
    const { container } = render(<Sparkline values={[1, 2, 3]} />)
    const path = container.querySelector('path')
    expect(path?.getAttribute('stroke')).toBe('#7c8da6')
  })

  it('maps tone="system" to cyan', () => {
    const { container } = render(<Sparkline values={[1, 2, 3]} tone="system" />)
    expect(container.querySelector('path')?.getAttribute('stroke')).toBe('#22d3ee')
  })

  it('maps tone="success" to emerald and tone="accent" to amber', () => {
    const { container, rerender } = render(<Sparkline values={[1, 2, 3]} tone="success" />)
    expect(container.querySelector('path')?.getAttribute('stroke')).toBe('#34d399')
    rerender(<Sparkline values={[1, 2, 3]} tone="accent" />)
    expect(container.querySelector('path')?.getAttribute('stroke')).toBe('#f59e0b')
  })

  it('maps tone="danger" to red', () => {
    const { container } = render(<Sparkline values={[1, 2, 3]} tone="danger" />)
    expect(container.querySelector('path')?.getAttribute('stroke')).toBe('#ef4444')
  })

  it('renders end dot using the same tone by default', () => {
    const { container } = render(<Sparkline values={[1, 2, 3]} tone="system" />)
    const circle = container.querySelector('circle')
    expect(circle?.getAttribute('fill')).toBe('#22d3ee')
  })

  it('omits end dot when showEndDot=false', () => {
    const { container } = render(<Sparkline values={[1, 2, 3]} showEndDot={false} />)
    expect(container.querySelector('circle')).toBeNull()
  })
})
