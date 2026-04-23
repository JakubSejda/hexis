// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Sparkline } from '@/components/ui/primitive/Sparkline'

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
    expect(path?.getAttribute('stroke')).toBe('#6b7280')
  })

  it('maps tone="primary" to emerald', () => {
    const { container } = render(<Sparkline values={[1, 2, 3]} tone="primary" />)
    expect(container.querySelector('path')?.getAttribute('stroke')).toBe('#10b981')
  })

  it('maps tone="danger" to red', () => {
    const { container } = render(<Sparkline values={[1, 2, 3]} tone="danger" />)
    expect(container.querySelector('path')?.getAttribute('stroke')).toBe('#ef4444')
  })

  it('renders end dot using the same tone by default', () => {
    const { container } = render(<Sparkline values={[1, 2, 3]} tone="primary" />)
    const circle = container.querySelector('circle')
    expect(circle?.getAttribute('fill')).toBe('#10b981')
  })

  it('omits end dot when showEndDot=false', () => {
    const { container } = render(<Sparkline values={[1, 2, 3]} showEndDot={false} />)
    expect(container.querySelector('circle')).toBeNull()
  })
})
