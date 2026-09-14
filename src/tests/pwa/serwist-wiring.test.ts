/**
 * Serwist configurator-mode wiring.
 *
 * The service worker is built by a CLI step now, not by a Next.js plugin, and
 * registration is no longer injected for us. Both are invisible to every other
 * test in the suite: a broken wiring here means the PWA and the rest-timer
 * notifications quietly stop working in production, with a green suite.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(__dirname, '../../..')
const read = (p: string) => readFileSync(resolve(root, p), 'utf8')
const pkg = JSON.parse(read('package.json')) as {
  scripts: Record<string, string>
  devDependencies: Record<string, string>
}

describe('build pipeline', () => {
  it('no longer pins the webpack bundler', () => {
    // The `--webpack` flag was a bridge while Serwist ran as a Next.js plugin.
    expect(pkg.scripts.build).not.toContain('--webpack')
  })

  it('builds the service worker after Next, so prerendered routes are precached', () => {
    const build = pkg.scripts.build!
    expect(build).toContain('serwist build')
    expect(build.indexOf('next build')).toBeLessThan(build.indexOf('serwist build'))
  })

  it('ships the CLI that the build step needs', () => {
    expect(pkg.devDependencies['@serwist/cli']).toBeDefined()
  })

  it('has a config the CLI can import', () => {
    // .mjs, not .js: the package is not `"type": "module"`, and the CLI loads
    // the config with a bare dynamic import.
    expect(existsSync(resolve(root, 'serwist.config.mjs'))).toBe(true)
    const config = read('serwist.config.mjs')
    expect(config).toContain('@serwist/next/config')
    expect(config).toContain('src/sw.ts')
  })
})

describe('next.config.ts', () => {
  it('does not wrap the config in the Serwist plugin any more', () => {
    const config = read('next.config.ts')
    expect(config).not.toContain('withSerwistInit')
  })
})

describe('service worker registration', () => {
  it('is explicit in the root layout — the plugin used to inject it', () => {
    expect(read('src/app/layout.tsx')).toContain('ServiceWorkerProvider')
  })

  it('sits behind a client boundary we own', () => {
    // @serwist/next/react ships no 'use client' directive, so importing it
    // into the server-rendered layout fails the build with
    // "createContext is not a function" while collecting page data.
    const provider = read('src/components/pwa/ServiceWorkerProvider.tsx')
    expect(provider.startsWith("'use client'")).toBe(true)
    expect(provider).toContain('SerwistProvider')
    expect(provider).toContain('/sw.js')
  })
})

describe('CI', () => {
  it('runs the production build, the only thing that can catch a broken SW step', () => {
    expect(read('.github/workflows/ci.yml')).toContain('npm run build')
  })
})
