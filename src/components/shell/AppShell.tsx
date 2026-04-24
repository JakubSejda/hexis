// src/components/shell/AppShell.tsx
import { db } from '@/db/client'
import { fetchWorkoutStreak } from '@/lib/queries/workout-streak'
import { AppHeader } from './AppHeader'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'

type Props = {
  userId: string
  userName: string | null
  userEmail: string
  children: React.ReactNode
}

export async function AppShell({ userId, userName, userEmail, children }: Props) {
  const streak = await fetchWorkoutStreak(db, userId)
  return (
    <div className="bg-background text-foreground min-h-screen">
      <Sidebar />
      <div className="flex min-h-screen flex-col md:pl-[220px]">
        <AppHeader streak={streak} userName={userName} userEmail={userEmail} />
        <main className="flex-1 pb-16 md:pb-0">{children}</main>
      </div>
      <BottomNav />
    </div>
  )
}
