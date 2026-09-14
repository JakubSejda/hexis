import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Minimal self-contained server bundle for the production Docker image.
  output: 'standalone',
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
