import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

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
      ],
    },
  },
])

export default eslintConfig
