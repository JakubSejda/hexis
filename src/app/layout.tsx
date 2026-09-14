import type { Metadata, Viewport } from 'next'
import { GeistMono } from 'geist/font/mono'
import { GeistSans } from 'geist/font/sans'
import './globals.css'
import { ServiceWorkerProvider } from '@/components/pwa/ServiceWorkerProvider'
import { SkipLink } from '@/components/shell/SkipLink'

export const metadata: Metadata = {
  title: 'Hexis',
  description: 'ἕξις — a stable state acquired through practice.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Hexis',
  },
  icons: {
    apple: '/icons/apple-touch-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#05080F',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="cs" className={`${GeistSans.variable} ${GeistMono.variable} dark`}>
      <body className="bg-background text-foreground min-h-screen antialiased">
        {/* Registration used to be injected by the Serwist Next.js plugin;
         * configurator mode registers nothing on its own. */}
        <ServiceWorkerProvider>
          <SkipLink />
          {children}
        </ServiceWorkerProvider>
      </body>
    </html>
  )
}
