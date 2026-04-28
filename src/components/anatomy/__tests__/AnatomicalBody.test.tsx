// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { AnatomicalBody, FRONT_SLUGS, BACK_SLUGS } from '../AnatomicalBody'

describe('AnatomicalBody', () => {
  it('renders one path per front slug with data-muscle attr', () => {
    const { container } = render(<AnatomicalBody view="front" highlights={{}} />)
    for (const slug of FRONT_SLUGS) {
      const node = container.querySelector(`[data-muscle="${slug}"]`)
      expect(node, `missing path for ${slug}`).not.toBeNull()
    }
  })

  it('renders one path per back slug with data-muscle attr', () => {
    const { container } = render(<AnatomicalBody view="back" highlights={{}} />)
    for (const slug of BACK_SLUGS) {
      const node = container.querySelector(`[data-muscle="${slug}"]`)
      expect(node, `missing path for ${slug}`).not.toBeNull()
    }
  })

  it('applies highlights map to matching slugs', () => {
    const { container } = render(
      <AnatomicalBody view="front" highlights={{ 'chest-mid': '#ff0000' }} />
    )
    const path = container.querySelector('[data-muscle="chest-mid"]')
    expect(path?.getAttribute('fill')).toBe('#ff0000')
  })

  it('uses inactive fill for slugs not in highlights map', () => {
    const { container } = render(<AnatomicalBody view="front" highlights={{}} />)
    const path = container.querySelector('[data-muscle="quads"]')
    expect(path?.getAttribute('fill')).toBe('#1f2733')
  })

  it('always renders the outline path with stroke and no fill', () => {
    const { container } = render(<AnatomicalBody view="front" highlights={{}} />)
    const outline = container.querySelector('[data-outline="true"]')
    expect(outline).not.toBeNull()
    expect(outline?.getAttribute('fill')).toBe('none')
  })

  it('exposes role=img with aria-label override', () => {
    const { container } = render(
      <AnatomicalBody view="back" highlights={{}} ariaLabel="Custom label" />
    )
    const svg = container.querySelector('svg')
    expect(svg?.getAttribute('role')).toBe('img')
    expect(svg?.getAttribute('aria-label')).toBe('Custom label')
  })
})
