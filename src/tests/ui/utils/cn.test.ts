import { describe, it, expect } from 'vitest'
import { cn } from '@/components/ui/utils/cn'

describe('cn', () => {
  it('joins truthy class strings', () => {
    expect(cn('a', 'b', 'c')).toBe('a b c')
  })

  it('filters falsy values (undefined, null, false, "")', () => {
    expect(cn('a', undefined, null, false, '', 'b')).toBe('a b')
  })

  it('resolves conflicting Tailwind classes via tailwind-merge (last wins)', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4')
  })

  it('accepts conditional objects (clsx feature)', () => {
    expect(cn('base', { active: true, disabled: false })).toBe('base active')
  })

  it('accepts arrays (clsx feature)', () => {
    expect(cn(['a', 'b'], 'c')).toBe('a b c')
  })
})
