/**
 * The shape grammar guard, tested through ESLint itself.
 *
 * Off-scale radii and retired classes fail silently in Tailwind, so the guard
 * is the only thing that makes them loud — and a guard nobody tests is a guard
 * nobody trusts (the R7 regex once missed `rounded-t-2xl` entirely).
 */
import { describe, it, expect, beforeAll } from 'vitest'
import { ESLint } from 'eslint'
import { resolve } from 'node:path'

const cwd = resolve(__dirname, '../../..')
let eslint: ESLint

beforeAll(() => {
  eslint = new ESLint({ cwd })
})

async function messagesFor(code: string): Promise<string[]> {
  const [result] = await eslint.lintText(code, { filePath: resolve(cwd, 'src/__probe__.tsx') })
  return (result?.messages ?? []).map((m) => m.message)
}

const radius = /Shape scale \(redesign D\)/
const hudClip = /HUD plate clips died/
const primary = /`primary` colour token was retired/

describe('shape scale guard', () => {
  it('rejects the generic radius ladder', async () => {
    for (const cls of [
      'rounded',
      'rounded-sm',
      'rounded-md',
      'rounded-lg',
      'rounded-xl',
      'rounded-2xl',
    ]) {
      expect(await messagesFor(`export const a = <div className="${cls}" />`)).toContainEqual(
        expect.stringMatching(radius)
      )
    }
  })

  it('rejects the directional forms too', async () => {
    for (const cls of ['rounded-t-2xl', 'rounded-b-lg', 'rounded-tl-xl', 'rounded-t']) {
      expect(await messagesFor(`export const a = <div className="${cls}" />`)).toContainEqual(
        expect.stringMatching(radius)
      )
    }
  })

  it('fires inside template literals as well as plain strings', async () => {
    const code = 'export const a = (x: string) => <div className={`${x} rounded-xl`} />'
    expect(await messagesFor(code)).toContainEqual(expect.stringMatching(radius))
  })

  it('accepts the four system radii', async () => {
    for (const cls of [
      'rounded-card',
      'rounded-t-card',
      'rounded-control',
      'rounded-tick',
      'rounded-full',
    ]) {
      expect(await messagesFor(`export const a = <div className="${cls}" />`)).not.toContainEqual(
        expect.stringMatching(radius)
      )
    }
  })
})

describe('retired HUD clips', () => {
  it('rejects hud-clip, hud-clip-sm and hud-sheet', async () => {
    for (const cls of ['hud-clip', 'hud-clip-sm', 'hud-sheet']) {
      expect(await messagesFor(`export const a = <div className="${cls}" />`)).toContainEqual(
        expect.stringMatching(hudClip)
      )
    }
  })

  it('leaves the hexagon lens alone', async () => {
    expect(await messagesFor('export const a = <div className="hud-hex" />')).toEqual([])
  })
})

describe('retired primary token guard', () => {
  it('still fires, so the shape rules did not replace the rule options', async () => {
    expect(await messagesFor('export const a = <div className="bg-primary" />')).toContainEqual(
      expect.stringMatching(primary)
    )
  })
})
