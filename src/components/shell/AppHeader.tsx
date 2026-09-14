'use client'
import Link from 'next/link'
import { signOut } from 'next-auth/react'
import { AREA_META } from './area-meta'
import { useActiveArea } from './use-active-area'
import { Heading, Menu, Pill } from '@/components/ui'

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
    <header className="border-border bg-surface-sunken flex h-14 items-center justify-between border-b px-4 pt-[env(safe-area-inset-top)] md:px-6">
      <div className="flex items-center gap-3">
        <span className="text-muted hidden font-mono text-xs tracking-[0.25em] uppercase md:inline">
          Life
        </span>
        <span aria-hidden="true" className="text-muted hidden font-mono text-xs md:inline">
          ·
        </span>
        {/* The page's h1. It is the only title every shell screen has — six of
         * them had no h1 at all before this. */}
        <Heading level={1} variant="region" className="text-accent font-medium tracking-[0.25em]">
          {label}
        </Heading>
      </div>
      <div className="flex items-center gap-3">
        {streak > 0 && (
          <Pill variant="warning" size="sm" className="hidden md:inline-flex">
            {streak} dní v řadě
          </Pill>
        )}
        <Menu.Root>
          <Menu.Trigger
            aria-label="Otevřít menu"
            className="bg-accent text-background hud-hex flex h-9 w-9 items-center justify-center text-sm font-semibold"
          >
            {initial}
          </Menu.Trigger>
          <Menu.Content align="end">
            <div className="text-muted px-2 py-1.5 text-xs">{userName ?? userEmail}</div>
            <Menu.Separator />
            <Menu.Item asChild>
              <Link href="/nutrition">Výživa</Link>
            </Menu.Item>
            <Menu.Item asChild>
              <Link href="/settings">Nastavení</Link>
            </Menu.Item>
            <Menu.Separator />
            <Menu.Item variant="danger" onSelect={() => signOut({ callbackUrl: '/login' })}>
              Odhlásit se
            </Menu.Item>
          </Menu.Content>
        </Menu.Root>
      </div>
    </header>
  )
}
