/**
 * One h1 per screen, and it lives in the header.
 *
 * A browser walk of the heading outline found six of twelve screens with no
 * <h1> at all — dashboard, nutrition, progress, photos, stats, bio all started
 * at <h2>, so a screen-reader user landing there got no page title. The area
 * label in `AppHeader` is the page's real name and is present on every shell
 * screen, so that is where the h1 belongs; the visible titles below it are
 * section headings.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { resolve, join } from 'node:path'

const root = resolve(__dirname, '../../..')

/** Screens outside the app shell render their own h1 — there is no header there. */
const OUTSIDE_THE_SHELL = [
  'src/app/page.tsx',
  'src/app/(auth)/login/login-form.tsx',
  'src/components/shell/AppHeader.tsx',
]

function sources(dir = resolve(root, 'src')): [string, string][] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = join(dir, e.name)
    if (e.isDirectory()) return e.name === 'tests' || e.name === '__tests__' ? [] : sources(full)
    return e.name.endsWith('.tsx')
      ? [[full.replace(root + '/', ''), readFileSync(full, 'utf8')] as [string, string]]
      : []
  })
}

describe('page outline', () => {
  it('keeps the h1 in the header, not scattered across the screens', () => {
    const offenders = sources()
      .filter(([path]) => !OUTSIDE_THE_SHELL.includes(path))
      .flatMap(([path, src]) =>
        src
          .split('\n')
          .map((line, i) => ({ path, line, no: i + 1 }))
          .filter(({ line }) => /level=\{1\}|<h1[\s>]/.test(line))
      )
      .map(({ path, no }) => `${path}:${no}`)
    expect(offenders).toEqual([])
  })

  it('gives the header the h1', () => {
    const header = readFileSync(resolve(root, 'src/components/shell/AppHeader.tsx'), 'utf8')
    expect(header).toMatch(/level=\{1\}/)
  })
})
