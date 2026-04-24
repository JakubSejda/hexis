'use client'
import { signOut } from 'next-auth/react'
import { AREA_META } from './area-meta'
import { useActiveArea } from './use-active-area'
import { Menu } from '@/components/ui'

type Props = {
  streak: number
  userName: string | null
  userEmail: string
}

export function AppHeader({ streak, userName, userEmail }: Props) {
  const active = useActiveArea()
  const label = active ? AREA_META[active].label : ''
  const initial = (userName ?? userEmail).trim().charAt(0).toUpperCase() || '?'

  return (
    <header className="border-border bg-surface-sunken flex h-14 items-center justify-between border-b px-4 md:h-14 md:px-6">
      <div className="flex items-center gap-3">
        <span className="text-muted hidden text-xs tracking-[0.25em] uppercase md:inline">
          Life
        </span>
        <span className="text-muted hidden text-xs md:inline">·</span>
        <span className="text-accent text-xs font-medium tracking-[0.25em] uppercase">{label}</span>
      </div>
      <div className="flex items-center gap-3">
        {streak > 0 && (
          <span className="text-muted hidden text-xs md:inline">
            <span className="text-accent font-semibold">{streak}</span> day streak
          </span>
        )}
        <Menu.Root>
          <Menu.Trigger
            aria-label="Open menu"
            className="bg-accent text-background flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold"
          >
            {initial}
          </Menu.Trigger>
          <Menu.Content align="end">
            <div className="text-muted px-2 py-1.5 text-xs">{userName ?? userEmail}</div>
            <Menu.Separator />
            <Menu.Item
              onSelect={() => {
                window.location.href = '/nutrition'
              }}
            >
              Nutrition
            </Menu.Item>
            <Menu.Item
              onSelect={() => {
                window.location.href = '/settings'
              }}
            >
              Settings
            </Menu.Item>
            <Menu.Separator />
            <Menu.Item variant="danger" onSelect={() => signOut()}>
              Sign out
            </Menu.Item>
          </Menu.Content>
        </Menu.Root>
      </div>
    </header>
  )
}
