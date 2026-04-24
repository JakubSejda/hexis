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

export type Area = 'dashboard' | 'training' | 'progress' | 'nutrition' | 'stats' | 'settings'
export type PlaceholderArea = 'rewards' | 'habits' | 'bio' | 'calendar'

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
] as const

export const PLACEHOLDER_META: Record<
  PlaceholderArea,
  { label: string; icon: ComponentType<SVGProps<SVGSVGElement>> }
> = {
  rewards: { label: 'Rewards', icon: Gift },
  habits: { label: 'Habits', icon: ListChecks },
  bio: { label: 'Player Bio', icon: UserCircle2 },
  calendar: { label: 'Quest Calendar', icon: CalendarDays },
}

export const PLACEHOLDER_ORDER: readonly PlaceholderArea[] = [
  'rewards',
  'habits',
  'bio',
  'calendar',
] as const
