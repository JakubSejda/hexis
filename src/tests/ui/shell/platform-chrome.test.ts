/**
 * Platform chrome contract (WIG audit W1).
 *
 * These rules live in config files and a stylesheet, not in components, so
 * they are asserted against the sources themselves. The theme-colour test in
 * particular exists because the value desynced silently once already: R1
 * moved the ground to #05080F and left `#0A0E14` behind in three places.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { resolve, join } from 'node:path'

const root = resolve(__dirname, '../../../..')
const read = (p: string) => readFileSync(resolve(root, p), 'utf8')

/** Every non-test .tsx under src, as [path, source] pairs. */
function appSources(dir = resolve(root, 'src')): [string, string][] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) return entry.name === 'tests' ? [] : appSources(full)
    return entry.name.endsWith('.tsx')
      ? [[full, readFileSync(full, 'utf8')] as [string, string]]
      : []
  })
}

const globals = read('src/app/globals.css')
const layout = read('src/app/layout.tsx')
const manifest = JSON.parse(read('public/manifest.json')) as Record<string, string>

/** The single source of truth for the page ground. */
const ground = globals.match(/--color-background:\s*(#[0-9a-fA-F]{3,8})/)![1]!.toLowerCase()

describe('viewport', () => {
  it('does not disable pinch zoom', () => {
    expect(layout).not.toMatch(/maximumScale/)
    expect(layout).not.toMatch(/userScalable:\s*false/)
  })

  it('keeps viewport-fit cover for the notch', () => {
    expect(layout).toMatch(/viewportFit:\s*'cover'/)
  })
})

describe('theme colour', () => {
  it('matches the page ground', () => {
    const themeColor = layout.match(/themeColor:\s*'(#[0-9a-fA-F]{3,8})'/)![1]!.toLowerCase()
    expect(themeColor).toBe(ground)
  })

  it('matches the page ground in the PWA manifest', () => {
    expect(manifest.theme_color!.toLowerCase()).toBe(ground)
    expect(manifest.background_color!.toLowerCase()).toBe(ground)
  })
})

describe('globals.css', () => {
  it('declares color-scheme: dark so native controls render dark', () => {
    expect(globals).toMatch(/color-scheme:\s*dark/)
  })

  it('removes the double-tap delay on interactive elements', () => {
    expect(globals).toMatch(/touch-action:\s*manipulation/)
  })

  it('replaces the default tap flash', () => {
    expect(globals).toMatch(/-webkit-tap-highlight-color/)
  })

  it('stops the confetti under prefers-reduced-motion', () => {
    const block = globals.match(/@media \(prefers-reduced-motion: reduce\) \{[\s\S]*?\n\}/)![0]
    expect(block).toMatch(/hud-confetti/)
  })
})

describe('skip link', () => {
  it('is rendered by the root layout', () => {
    expect(layout).toMatch(/<SkipLink/)
  })

  it('has a target: every main landmark carries id="main"', () => {
    const landmarks = appSources()
      .flatMap(([path, src]) => src.split('\n').map((line, i) => ({ path, line, no: i + 1 })))
      .filter(({ line }) => line.includes('<main'))
    expect(landmarks.length).toBeGreaterThan(0)
    const untargeted = landmarks
      .filter(({ line }) => !line.includes('id="main"'))
      .map(({ path, no }) => `${path.replace(root + '/', '')}:${no}`)
    expect(untargeted).toEqual([])
  })
})
