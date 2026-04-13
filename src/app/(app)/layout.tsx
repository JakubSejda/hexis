import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user) {
    redirect('/login')
  }

  return (
    <div className="bg-background text-foreground min-h-screen">
      <header className="border-border border-b px-6 py-3">
        <div className="flex items-center justify-between">
          <span className="text-muted text-sm">Hexis</span>
          <span className="text-muted text-sm">{session.user.email}</span>
        </div>
      </header>
      <main className="p-6">{children}</main>
    </div>
  )
}
