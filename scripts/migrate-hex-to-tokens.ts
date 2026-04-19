/**
 * migrate-hex-to-tokens.ts
 *
 * Rewrites Tailwind arbitrary-value color classes (e.g. `bg-[#0a0e14]`)
 * to design-token classes (e.g. `bg-background`) across all .tsx/.ts files
 * under src/.
 *
 * Glob mechanism: fs.readdirSync + manual recursion (Option 1 — zero-risk,
 * no extra deps, works on any Node version).
 *
 * Usage:
 *   npx tsx scripts/migrate-hex-to-tokens.ts          # write changes
 *   npx tsx scripts/migrate-hex-to-tokens.ts --dry    # print changes only
 */

import fs from 'node:fs'
import path from 'node:path'

// ---------------------------------------------------------------------------
// Token map: hex (lower-case, no #) → token name
// ---------------------------------------------------------------------------
const HEX_TO_TOKEN: Record<string, string> = {
  '0a0e14': 'background',
  '141a22': 'surface',
  '1a2230': 'surface-raised',
  '070b10': 'surface-sunken',
  '1f2733': 'border',
  e5e7eb: 'foreground',
  '6b7280': 'muted',
  '10b981': 'primary',
  '064e3b': 'primary-soft',
  '34d399': 'primary-muted',
  f59e0b: 'accent',
  '78350f': 'accent-soft',
  fbbf24: 'accent-muted',
  ef4444: 'danger',
  '38bdf8': 'info',
}

// Utility prefixes that accept a color value in Tailwind
const PREFIXES = [
  'bg',
  'text',
  'border',
  'ring',
  'fill',
  'stroke',
  'outline',
  'from',
  'via',
  'to',
  'caret',
  'decoration',
  'placeholder',
  'divide',
  'accent',
  'shadow',
]

// ---------------------------------------------------------------------------
// Build a single regex that matches  <prefix>-[#<hex>]  at a word boundary.
//
// We need \b before the prefix so we don't match mid-token, but we must NOT
// swallow Tailwind variant prefixes (hover:, sm:, data-[…]:) — those end with
// ":" which is a non-word char, so \b fires correctly just before the utility
// prefix letter.
//
// Capture groups:
//   1 — the prefix  (e.g. "bg")
//   2 — the hex     (e.g. "0a0e14")
// ---------------------------------------------------------------------------
const hexAlts = Object.keys(HEX_TO_TOKEN).join('|')
const prefixAlts = PREFIXES.join('|')
const PATTERN = new RegExp(`\\b(${prefixAlts})-\\[#(${hexAlts})\\]`, 'gi')

// ---------------------------------------------------------------------------
// File walker — recursively collects .ts / .tsx files
// ---------------------------------------------------------------------------
function walk(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  const files: string[] = []
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...walk(full))
    } else if (entry.isFile() && /\.(tsx?|ts)$/.test(entry.name)) {
      files.push(full)
    }
  }
  return files
}

// ---------------------------------------------------------------------------
// Apply replacements to a single file's content.
// Returns { newContent, count } where count is the number of replacements.
// ---------------------------------------------------------------------------
function applyReplacements(content: string): { newContent: string; count: number } {
  let count = 0

  // Reset lastIndex between uses (regex has 'g' flag)
  PATTERN.lastIndex = 0

  const newContent = content.replace(PATTERN, (_match, prefix: string, hex: string) => {
    const token = HEX_TO_TOKEN[hex.toLowerCase()]
    if (!token) {
      // Hex matched the alternation but somehow has no token — leave as-is
      return _match
    }
    count++
    return `${prefix}-${token}`
  })

  return { newContent, count }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
function main() {
  const dry = process.argv.includes('--dry')
  const srcDir = path.join(process.cwd(), 'src')

  if (!fs.existsSync(srcDir)) {
    console.error(`ERROR: src/ directory not found at ${srcDir}`)
    process.exit(1)
  }

  const files = walk(srcDir)

  let totalFiles = 0
  let totalReplacements = 0

  for (const file of files) {
    const original = fs.readFileSync(file, 'utf8')
    const { newContent, count } = applyReplacements(original)

    if (count === 0) continue

    const rel = path.relative(process.cwd(), file)
    totalFiles++
    totalReplacements += count

    if (dry) {
      console.log(`[DRY] ${rel}  (${count} replacement${count !== 1 ? 's' : ''})`)
    } else {
      fs.writeFileSync(file, newContent, 'utf8')
      console.log(`[WROTE] ${rel}  (${count} replacement${count !== 1 ? 's' : ''})`)
    }
  }

  console.log(
    `\nTotal: ${totalReplacements} replacement${totalReplacements !== 1 ? 's' : ''} across ${totalFiles} file${totalFiles !== 1 ? 's' : ''}.${dry ? ' (dry run — no files written)' : ''}`
  )
}

main()
