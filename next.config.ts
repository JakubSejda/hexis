import type { NextConfig } from 'next'
import withSerwistInit from '@serwist/next'

const withSerwist = withSerwistInit({
  swSrc: 'src/sw.ts',
  swDest: 'public/sw.js',
  disable: process.env.NODE_ENV === 'development',
})

const nextConfig: NextConfig = {
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

export default withSerwist(nextConfig)
