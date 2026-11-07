'use client'
import Link from 'next/link'
import { signOut } from 'next-auth/react'
import { Flame } from 'lucide-react'
import { AREA_META } from './area-meta'
import { useActiveArea } from './use-active-area'
import { czPlural, DAYS } from '@/lib/cz-plural'
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
    <header className="bg-background/80 sticky top-0 z-30 flex h-14 items-center justify-between px-4 pt-[env(safe-area-inset-top)] backdrop-blur-md md:px-6">
      {/* The page's h1. It is the only title every shell screen has. */}
      <Heading level={1} variant="region" className="text-foreground text-sm">
        {label}
      </Heading>
      <div className="flex items-center gap-2">
        {streak > 0 && (
          <Pill
            variant="neutral"
            size="md"
            className="text-reward"
            aria-label={`${streak} dní v řadě`}
          >
            <Flame className="size-4" aria-hidden />
            {streak} {czPlural(streak, DAYS)}
          </Pill>
        )}
        <Menu.Root>
          <Menu.Trigger
            aria-label="Otevřít menu"
            className="bg-surface-raised text-accent font-display grid size-9 place-items-center rounded-full text-sm font-black"
          >
            {initial}
          </Menu.Trigger>
          <Menu.Content align="end">
            <div className="text-muted px-2 py-1.5 text-xs">{userName ?? userEmail}</div>
            <Menu.Separator />
            <Menu.Item asChild>
              <Link href="/bio">Profil hráče</Link>
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
