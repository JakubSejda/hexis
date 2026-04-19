import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { Providers } from './providers'
import { XpFeedbackProvider } from '@/components/xp/XpFeedbackProvider'
import { InstallPrompt } from '@/components/pwa/InstallPrompt'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user) {
    redirect('/login')
  }

  return (
    <div className="bg-background text-foreground flex min-h-screen flex-col">
      <main className="flex-1 pb-16">
        <Providers>
          <XpFeedbackProvider>{children}</XpFeedbackProvider>
        </Providers>
      </main>
      <nav className="border-border bg-surface fixed right-0 bottom-0 left-0 flex h-16 border-t">
        <TabLink href="/dashboard" label="Dashboard" />
        <TabLink href="/workout" label="Trénink" />
        <TabLink href="/progress/body" label="Progres" />
        <TabLink href="/settings/plates" label="Nastavení" />
      </nav>
      <InstallPrompt />
    </div>
  )
}

function TabLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="text-foreground hover:text-primary flex flex-1 items-center justify-center text-sm transition-colors"
    >
      {label}
    </Link>
  )
}
