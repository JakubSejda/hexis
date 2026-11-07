'use client'
import { useSyncExternalStore } from 'react'
import { SegmentedControl } from '@/components/ui'

const KEY = 'hexis-accent'
type Accent = 'blue' | 'neon'

const OPTIONS = [
  { label: 'Modrá záře', value: 'blue' },
  { label: 'Neon', value: 'neon' },
] as const

function subscribe(onChange: () => void): () => void {
  const mo = new MutationObserver(onChange)
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-accent'] })
  return () => mo.disconnect()
}

const read = (): Accent => (document.documentElement.dataset.accent === 'neon' ? 'neon' : 'blue')

/** Per-device accent: stored locally and applied to <html> (see ACCENT_BOOT in the root layout). */
export function AccentSwitch() {
  const accent = useSyncExternalStore(subscribe, read, () => 'blue' as const)

  const choose = (v: string) => {
    const next: Accent = v === 'neon' ? 'neon' : 'blue'
    if (next === 'neon') document.documentElement.dataset.accent = 'neon'
    else delete document.documentElement.dataset.accent
    try {
      localStorage.setItem(KEY, next)
    } catch {
      // Private mode: the choice simply lasts until reload.
    }
  }

  return (
    <SegmentedControl
      name="accent"
      label="Barva akcentu"
      options={OPTIONS}
      value={accent}
      onChange={choose}
    />
  )
}
