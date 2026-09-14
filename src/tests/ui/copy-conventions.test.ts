/**
 * Copy and primitive-adoption conventions, enforced across the app.
 *
 * These are the findings the WIG audit kept hitting in a different file each
 * time: three dots instead of an ellipsis, an English heading in a Czech UI, a
 * raw <h1> that skips the HUD display grammar, a native confirm() in an app
 * that ships its own Sheet. One test each, so the next one is loud.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { resolve, join } from 'node:path'

const root = resolve(__dirname, '../../..')

function appSources(dir = resolve(root, 'src')): [string, string][] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) return entry.name === 'tests' ? [] : appSources(full)
    // .ts as well as .tsx: AREA_META lives in a .ts file, and a .tsx-only scan
    // let ten English labels sit in the main navigation of a Czech app.
    return entry.name.endsWith('.tsx') || entry.name.endsWith('.ts')
      ? [[full.replace(root + '/', ''), readFileSync(full, 'utf8')] as [string, string]]
      : []
  })
}

const sources = appSources()

function hits(predicate: (line: string) => boolean, skip: (path: string) => boolean = () => false) {
  return sources
    .filter(([path]) => !skip(path))
    .flatMap(([path, src]) =>
      src
        .split('\n')
        .map((line, i) => ({ path, line, no: i + 1 }))
        .filter(({ line }) => predicate(line))
    )
    .map(({ path, no, line }) => `${path}:${no} ${line.trim().slice(0, 60)}`)
}

describe('copy', () => {
  it('uses a real ellipsis in placeholders, not three dots', () => {
    expect(hits((l) => /placeholder="[^"]*\.\.\./.test(l))).toEqual([])
  })

  it('writes Czech with its diacritics', () => {
    // Words the audit actually found stripped; not a spell checker.
    const misspelt = /\b(trenink|Poznamka|volitelne|Prihlasit|Ulozit|Zrusit)\b/
    expect(hits((l) => misspelt.test(l))).toEqual([])
  })

  it('keeps the interface in Czech', () => {
    const english =
      /["'>](Settings|Profile|Plate Inventory|Archive|Front|Side|Back|Other|Training|Grid|Timeline|Sign out|Nutrition|Dashboard|Progress|Stats|Habits|Rewards|Player Bio|Quest Calendar|Life Areas|Avatar Progress|Muscle Rank|Tier ladder|Daily|Weekly|Muscle Volume|This Week|XP History)["'<]/
    expect(hits((l) => english.test(l))).toEqual([])
  })
})

describe('primitive adoption', () => {
  it('routes headings through the Heading primitive', () => {
    // A raw heading skips the HUD grammar — that is how six screens ended up
    // with `text-2xl font-bold` instead of the display treatment, and how the
    // mono region eyebrows drifted into four slightly different spellings of
    // the same class list. The two primitives that render the tags are exempt.
    expect(
      hits(
        (l) => /<h[1-3][\s>]/.test(l),
        (path) =>
          path.endsWith('ui/primitive/Heading.tsx') || path.endsWith('ui/layout/Section.tsx')
      )
    ).toEqual([])
  })

  it('confirms destructive actions in the app, not in a browser dialog', () => {
    expect(hits((l) => /(?<![\w.])confirm\(/.test(l))).toEqual([])
  })
})
