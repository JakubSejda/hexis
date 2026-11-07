import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

/**
 * Shape grammar guard (redesign D, 2026-11). Retired tokens and off-scale
 * radii fail SILENTLY — Tailwind simply emits no rule, or a radius that is
 * not part of the system — so these selectors are what makes them loud.
 *
 * Shared array rather than its own config block: ESLint REPLACES a rule's
 * options when two blocks configure the same rule for the same file, so a
 * standalone block would quietly disable the P2 form-control selectors.
 * Covered by src/tests/lint/hud-grammar-guard.test.ts.
 */
const PRIMARY_TOKEN_MSG =
  'The `primary` colour token was retired in R7. Use `system` (blue = world/info), `accent` (action/XP) or `success` (semantic success only).'
const RADIUS_MSG =
  'Shape scale (redesign D): use `rounded-card` (plates, sheets), `rounded-control` (rows, inputs, chips), `rounded-tick` (checkboxes) or `rounded-full` (buttons, pills, dots).'
const HUD_CLIP_MSG =
  'The HUD plate clips died with redesign D: use `rounded-card` / `rounded-control` (or the Card primitive).'

const RADIUS_LADDER =
  '\\brounded(-(t|b|l|r|tl|tr|bl|br|s|e|ss|se|es|ee))?(-(none|xs|sm|md|lg|xl|2xl|3xl|4xl))?(?![-\\w])'

const hudGrammarSelectors = [
  {
    selector: 'Literal[value=/\\b(bg|text|border|ring|from|to|via|fill|stroke)-primary\\b/]',
    message: PRIMARY_TOKEN_MSG,
  },
  {
    selector:
      'TemplateElement[value.raw=/\\b(bg|text|border|ring|from|to|via|fill|stroke)-primary\\b/]',
    message: PRIMARY_TOKEN_MSG,
  },
  { selector: `Literal[value=/${RADIUS_LADDER}/]`, message: RADIUS_MSG },
  { selector: `TemplateElement[value.raw=/${RADIUS_LADDER}/]`, message: RADIUS_MSG },
  { selector: 'Literal[value=/\\bhud-(clip|sheet)/]', message: HUD_CLIP_MSG },
  { selector: 'TemplateElement[value.raw=/\\bhud-(clip|sheet)/]', message: HUD_CLIP_MSG },
]

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    // Sibling git worktrees (e.g. .worktrees/<branch>/) have their own
    // .next/, node_modules/, etc. — never lint into them.
    '.worktrees/**',
    // Generated service worker bundle from `next build` (Serwist output):
    'public/sw.js',
    'public/sw.js.map',
    'public/swe-worker-*.js',
    'public/workbox-*.js',
    'public/workbox-*.js.map',
  ]),
  // Design-system adherence guard (Polish P2):
  // 1. §11.2 — consumers import from the @/components/ui barrel, never nested paths.
  // 2. Raw form controls are banned outside the UI kit — use the primitives.
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/components/ui/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/components/ui/*/*'],
              message: 'Import from the @/components/ui barrel (spec §11.2).',
            },
          ],
        },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: "JSXOpeningElement[name.name='select']",
          message: 'Use the Select primitive from @/components/ui.',
        },
        {
          selector: "JSXOpeningElement[name.name='textarea']",
          message: 'Use the Textarea primitive from @/components/ui.',
        },
        {
          selector:
            "JSXOpeningElement[name.name='input']:has(JSXAttribute[name.name='type'][value.value='checkbox'])",
          message: 'Use the Checkbox primitive from @/components/ui.',
        },
        {
          selector:
            "JSXOpeningElement[name.name='input']:has(JSXAttribute[name.name='type'][value.value='radio'])",
          message: 'Use the Radio primitive from @/components/ui.',
        },
        ...hudGrammarSelectors,
      ],
    },
  },
  // The block above deliberately ignores the UI kit, but the HUD grammar
  // binds there too — Toast/Tabs/Dialog were exactly where it had rotted.
  {
    files: ['src/components/ui/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': ['error', ...hudGrammarSelectors],
    },
  },
  // The guard's own test feeds it the banned class names as data — linting
  // them is a false positive on the one file that proves the guard works.
  {
    files: ['src/tests/lint/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': 'off',
    },
  },
])

export default eslintConfig
