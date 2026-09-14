/**
 * The HUD grammar guard, tested through ESLint itself.
 *
 * R7 added the guard and the W3 audit found the hole it left: the regex
 * matched `rounded-2xl` but not `rounded-t-2xl`, which is exactly how
 * `BottomSheet` kept a pre-Reforge radius through a slice whose whole point
 * was removing them. A guard nobody tests is a guard nobody trusts.
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

const radius = /radius ladder died/
const controlScale = /Control scale \(2026-09-14\)/
const primary = /`primary` colour token was retired/

describe('radius ladder guard', () => {
  it('rejects the plain plate radii', async () => {
    for (const cls of ['rounded-lg', 'rounded-xl', 'rounded-2xl', 'rounded-3xl']) {
      expect(await messagesFor(`export const a = <div className="${cls}" />`)).toContainEqual(
        expect.stringMatching(radius)
      )
    }
  })

  it('rejects the directional forms too — the hole BottomSheet slipped through', async () => {
    for (const cls of ['rounded-t-2xl', 'rounded-b-lg', 'rounded-tl-xl', 'rounded-br-3xl']) {
      expect(await messagesFor(`export const a = <div className="${cls}" />`)).toContainEqual(
        expect.stringMatching(radius)
      )
    }
  })

  it('fires inside template literals as well as plain strings', async () => {
    const code = 'export const a = (x: string) => <div className={`${x} rounded-t-2xl`} />'
    expect(await messagesFor(code)).toContainEqual(expect.stringMatching(radius))
  })

  it('bans the control scale too — displays are square, chassis is clipped', async () => {
    for (const cls of ['rounded-md', 'rounded-sm', 'rounded']) {
      expect(await messagesFor(`export const a = <div className="${cls}" />`)).toContainEqual(
        expect.stringMatching(controlScale)
      )
    }
  })

  it('still allows rounded-full — the lens scale moves with the tier emblem slice', async () => {
    const messages = await messagesFor('export const a = <div className="rounded-full" />')
    expect(messages).not.toContainEqual(expect.stringMatching(radius))
    expect(messages).not.toContainEqual(expect.stringMatching(controlScale))
  })
})

describe('retired primary token guard', () => {
  it('still fires, so widening the radius rule did not replace the rule options', async () => {
    expect(await messagesFor('export const a = <div className="bg-primary" />')).toContainEqual(
      expect.stringMatching(primary)
    )
  })
})
