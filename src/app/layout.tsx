import type { Metadata, Viewport } from 'next'
import { GeistMono } from 'geist/font/mono'
import './globals.css'

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
  themeColor: '#0A0E14',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="cs" className={`${GeistMono.variable} dark`}>
      <body className="bg-background text-foreground min-h-screen antialiased">{children}</body>
    </html>
  )
}
