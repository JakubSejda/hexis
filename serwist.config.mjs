// Serwist configurator mode (@serwist/next/config). The service worker is
// built by `serwist build` after `next build`, not by a Next.js plugin, which
// is what lets the app build with Turbopack instead of the `--webpack` bridge.
//
// .mjs, not .js: this package is not `"type": "module"`, and the Serwist CLI
// loads the config with a bare dynamic import.
import { serwist } from '@serwist/next/config'

export default serwist({
  swSrc: 'src/sw.ts',
  swDest: 'public/sw.js',
  // Keep lazy giants (heic2any, ~1.3 MB) out of the install download; they cache on first use.
  maximumFileSizeToCacheInBytes: 1024 * 1024,
})
