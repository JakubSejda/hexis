// src/app/(app)/layout.tsx
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { Providers } from './providers'
import { XpFeedbackProvider } from '@/components/xp/XpFeedbackProvider'
import { InstallPrompt } from '@/components/pwa/InstallPrompt'
import { AppShell } from '@/components/shell'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user) {
    redirect('/login')
  }

  return (
    <Providers>
      <XpFeedbackProvider>
        <AppShell
          userId={session.user.id as string}
          userName={session.user.name ?? null}
          userEmail={session.user.email ?? ''}
        >
          {children}
        </AppShell>
        <InstallPrompt />
      </XpFeedbackProvider>
    </Providers>
  )
}
