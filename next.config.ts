import path from 'node:path'
import type { NextConfig } from 'next'

// A stray lockfile higher up (e.g. on the Desktop) makes Next guess the wrong
// workspace root, which breaks the standalone bundle's file tracing.
const root = path.resolve(__dirname)

const nextConfig: NextConfig = {
  // Minimal self-contained server bundle for the production Docker image.
  output: 'standalone',
  outputFileTracingRoot: root,
  turbopack: { root },
  // Lets a phone on the same Wi-Fi load dev assets, e.g. DEV_ORIGINS=192.168.1.178.
  allowedDevOrigins: process.env.DEV_ORIGINS?.split(',').filter(Boolean) ?? [],
  async redirects() {
    return [
      { source: '/workout', destination: '/training', permanent: true },
      { source: '/workout/:path*', destination: '/training/:path*', permanent: true },
      { source: '/avatar', destination: '/stats', permanent: true },
      { source: '/progress/body', destination: '/progress', permanent: true },
      { source: '/progress/nutrition', destination: '/nutrition', permanent: true },
      { source: '/progress/strength', destination: '/stats/strength', permanent: true },
    ]
  },
}

export default nextConfig
