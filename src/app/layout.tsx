import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Hexis',
  description: 'ἕξις — a stable state acquired through practice.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="cs" className="dark">
      <body className="bg-background text-foreground min-h-screen antialiased">{children}</body>
    </html>
  )
}
