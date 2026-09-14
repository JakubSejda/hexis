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
})
