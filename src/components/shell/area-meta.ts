import {
  Home,
  Dumbbell,
  TrendingUp,
  Apple,
  User,
  Settings,
  Gift,
  ListChecks,
  UserCircle2,
  CalendarDays,
} from 'lucide-react'
import type { ComponentType, SVGProps } from 'react'

export type Area =
  | 'dashboard'
  | 'training'
  | 'progress'
  | 'nutrition'
  | 'stats'
  | 'habits'
  | 'rewards'
  | 'settings'
export type PlaceholderArea = 'bio' | 'calendar'

type Meta = {
  label: string
  href: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
  /** routes whose pathname should mark this area active (primary + sub-routes) */
  matches: (pathname: string) => boolean
}

export const AREA_META: Record<Area, Meta> = {
  dashboard: {
    label: 'Dashboard',
    href: '/dashboard',
    icon: Home,
    matches: (p) => p === '/dashboard' || p.startsWith('/dashboard/'),
  },
  training: {
    label: 'Training',
    href: '/training',
    icon: Dumbbell,
    matches: (p) => p === '/training' || p.startsWith('/training/'),
  },
  progress: {
    label: 'Progress',
    href: '/progress',
    icon: TrendingUp,
    matches: (p) => p === '/progress' || p.startsWith('/progress/'),
  },
  nutrition: {
    label: 'Nutrition',
    href: '/nutrition',
    icon: Apple,
    matches: (p) => p === '/nutrition' || p.startsWith('/nutrition/'),
  },
  stats: {
    label: 'Stats',
    href: '/stats',
    icon: User,
    matches: (p) => p === '/stats' || p.startsWith('/stats/'),
  },
  habits: {
    label: 'Habits',
    href: '/habits',
    icon: ListChecks,
    matches: (p) => p === '/habits' || p.startsWith('/habits/'),
  },
  rewards: {
    label: 'Rewards',
    href: '/rewards',
    icon: Gift,
    matches: (p) => p === '/rewards' || p.startsWith('/rewards/'),
  },
  settings: {
    label: 'Settings',
    href: '/settings',
    icon: Settings,
    matches: (p) => p === '/settings' || p.startsWith('/settings/'),
  },
}

export const MOBILE_TABS: readonly Area[] = ['dashboard', 'training', 'progress', 'stats'] as const
export const SIDEBAR_AREAS: readonly Area[] = [
  'dashboard',
  'training',
  'nutrition',
  'progress',
  'stats',
  'habits',
  'rewards',
] as const

export const PLACEHOLDER_META: Record<
  PlaceholderArea,
  { label: string; icon: ComponentType<SVGProps<SVGSVGElement>> }
> = {
  bio: { label: 'Player Bio', icon: UserCircle2 },
  calendar: { label: 'Quest Calendar', icon: CalendarDays },
}

export const PLACEHOLDER_ORDER: readonly PlaceholderArea[] = ['bio', 'calendar'] as const
