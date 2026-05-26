// @vitest-environment jsdom
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest'
import { eq, like } from 'drizzle-orm'
import { render, screen } from '@testing-library/react'

vi.mock('@/lib/auth-helpers', () => ({
  requireSessionUser: vi.fn(),
}))
vi.mock('next/navigation', async () => {
  const actual = (await vi.importActual('next/navigation')) as Record<string, unknown>
  return { ...actual, redirect: vi.fn() }
})
vi.mock('@/components/photos/Lightbox', () => ({
  Lightbox: () => null,
}))

import { db } from '@/db/client'
import * as schema from '@/db/schema'
import { users, sessions, habits, habitCompletions, measurements, bodyPhotos } from '@/db/schema'
import { requireSessionUser } from '@/lib/auth-helpers'
import CalendarPage from '@/app/(app)/calendar/page'

const PREFIX = 'calpg_'
const USER = `${PREFIX}user00000000000001`

async function cleanup() {
  await db.delete(sessions).where(like(sessions.userId, `${PREFIX}%`))
  await db.delete(habitCompletions).where(like(habitCompletions.userId, `${PREFIX}%`))
  await db.delete(habits).where(like(habits.userId, `${PREFIX}%`))
  await db.delete(measurements).where(like(measurements.userId, `${PREFIX}%`))
  await db.delete(bodyPhotos).where(like(bodyPhotos.userId, `${PREFIX}%`))
  await db.delete(schema.plans).where(like(schema.plans.userId, `${PREFIX}%`))
  await db.delete(users).where(like(users.id, `${PREFIX}%`))
}

beforeAll(cleanup)
afterAll(cleanup)

beforeEach(async () => {
  vi.setSystemTime(new Date('2026-05-15T12:00:00Z'))
  await cleanup()
  await db.insert(users).values({ id: USER, email: `${PREFIX}c@hexis.local` })
  vi.mocked(requireSessionUser).mockResolvedValue({
    id: USER,
    email: `${PREFIX}c@hexis.local`,
    name: null,
  } as never)
})

describe('/calendar page', () => {
  it('renders header + grid + legend in empty state', async () => {
    const ui = await CalendarPage({ searchParams: Promise.resolve({}) })
    render(ui)
    expect(screen.getByText(/květen 2026/i)).toBeInTheDocument()
    expect(screen.getByText('Training')).toBeInTheDocument()
    expect(screen.getByText(/3\+ den streak/i)).toBeInTheDocument()
  })

  it('honors ?ym param when valid', async () => {
    const ui = await CalendarPage({ searchParams: Promise.resolve({ ym: '2026-04' }) })
    render(ui)
    expect(screen.getByText(/duben 2026/i)).toBeInTheDocument()
  })

  it('falls back to current month on invalid ?ym', async () => {
    const ui = await CalendarPage({ searchParams: Promise.resolve({ ym: 'bogus' }) })
    render(ui)
    expect(screen.getByText(/květen 2026/i)).toBeInTheDocument()
  })

  it('marks today cell with data-today', async () => {
    const ui = await CalendarPage({ searchParams: Promise.resolve({}) })
    render(ui)
    const todayCell = document.querySelector('[data-date="2026-05-15"]')
    expect(todayCell?.getAttribute('data-today')).toBe('true')
  })

  it('renders streak treatment when 3+ consecutive training days exist', async () => {
    await db.insert(sessions).values([
      {
        userId: USER,
        startedAt: new Date('2026-05-10T10:00:00Z'),
        finishedAt: new Date('2026-05-10T11:00:00Z'),
      },
      {
        userId: USER,
        startedAt: new Date('2026-05-11T10:00:00Z'),
        finishedAt: new Date('2026-05-11T11:00:00Z'),
      },
      {
        userId: USER,
        startedAt: new Date('2026-05-12T10:00:00Z'),
        finishedAt: new Date('2026-05-12T11:00:00Z'),
      },
    ])
    const ui = await CalendarPage({ searchParams: Promise.resolve({}) })
    render(ui)
    expect(document.querySelector('[data-date="2026-05-10"]')?.getAttribute('data-streak')).toBe(
      'true'
    )
    expect(document.querySelector('[data-date="2026-05-12"]')?.getAttribute('data-streak')).toBe(
      'true'
    )
  })

  it('injects forecast plan label on today+1 when plans exist', async () => {
    await db
      .insert(schema.plans)
      .values([{ userId: USER, name: 'Plán A', order: 0, slug: 'plan-a' }])
    const ui = await CalendarPage({ searchParams: Promise.resolve({}) })
    render(ui)
    expect(document.querySelector('[data-date="2026-05-16"]')?.getAttribute('data-forecast')).toBe(
      'true'
    )
  })
})
