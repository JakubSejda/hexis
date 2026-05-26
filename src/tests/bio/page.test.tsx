// @vitest-environment jsdom
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest'
import { eq, like, inArray } from 'drizzle-orm'
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
import { users, sessions, sessionSets, bodyPhotos, measurements, xpEvents } from '@/db/schema'
import { requireSessionUser } from '@/lib/auth-helpers'
import BioPage from '@/app/(app)/bio/page'

const PREFIX = 'biopg_'
const USER = `${PREFIX}user00000000000001`

async function cleanup() {
  const ownedSessions = await db
    .select({ id: sessions.id })
    .from(sessions)
    .where(like(sessions.userId, `${PREFIX}%`))
  const ids = ownedSessions.map((r) => r.id)
  if (ids.length) {
    await db.delete(sessionSets).where(inArray(sessionSets.sessionId, ids))
  }
  await db.delete(sessions).where(like(sessions.userId, `${PREFIX}%`))
  await db.delete(bodyPhotos).where(like(bodyPhotos.userId, `${PREFIX}%`))
  await db.delete(measurements).where(like(measurements.userId, `${PREFIX}%`))
  await db.delete(xpEvents).where(like(xpEvents.userId, `${PREFIX}%`))
  await db.delete(users).where(like(users.id, `${PREFIX}%`))
}

beforeAll(cleanup)
afterAll(cleanup)

beforeEach(async () => {
  vi.setSystemTime(new Date('2026-05-07T12:00:00Z'))
  await cleanup()
  await db.insert(users).values({ id: USER, email: `${PREFIX}b@hexis.local` })
  vi.mocked(requireSessionUser).mockResolvedValue({
    id: USER,
    email: `${PREFIX}b@hexis.local`,
    name: null,
  } as never)
})

describe('/bio page', () => {
  it('renders all 5 sections in empty state', async () => {
    const ui = await BioPage()
    render(ui)
    expect(screen.getByText('Hráč')).toBeInTheDocument()
    expect(screen.getByText(/vitals/i)).toBeInTheDocument()
    expect(screen.getByText(/goal/i)).toBeInTheDocument()
    expect(screen.getByText(/lifetime/i)).toBeInTheDocument()
    expect(screen.getByText(/transformation/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /nastav si svůj cíl/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /přidej fotku/i })).toBeInTheDocument()
  })

  it('renders populated data when profile and history exist', async () => {
    await db
      .update(users)
      .set({
        name: 'Jakub',
        birthDate: '1990-01-15',
        gender: 'male',
        heightCm: 180,
        goalKg: '78.50',
        goalText: 'Cut',
        startedAt: '2026-05-06',
      })
      .where(eq(users.id, USER))
    await db.insert(measurements).values([
      { userId: USER, weekStart: '2024-01-01', weightKg: '90.00' },
      { userId: USER, weekStart: '2026-05-01', weightKg: '82.50' },
    ])
    const [s] = (await db.insert(sessions).values({
      userId: USER,
      startedAt: new Date('2024-02-01T10:00:00Z'),
      finishedAt: new Date('2024-02-01T11:00:00Z'),
    })) as unknown as [{ insertId: number }]
    await db.insert(sessionSets).values({
      sessionId: s.insertId,
      exerciseId: 1,
      setIndex: 0,
      weightKg: '100.00',
      reps: 5,
    })
    await db.insert(xpEvents).values({ userId: USER, eventType: 'session_complete', xpDelta: 50 })
    await db.insert(bodyPhotos).values([
      {
        userId: USER,
        takenAt: '2024-01-01',
        weekStart: '2023-12-25',
        pose: 'front',
        storageKey: `${PREFIX}a`,
        widthPx: 100,
        heightPx: 100,
        byteSize: 1000,
      },
      {
        userId: USER,
        takenAt: '2026-05-01',
        weekStart: '2026-04-27',
        pose: 'front',
        storageKey: `${PREFIX}b`,
        widthPx: 100,
        heightPx: 100,
        byteSize: 1000,
      },
    ])

    const ui = await BioPage()
    render(ui)
    expect(screen.getByText('Jakub')).toBeInTheDocument()
    expect(screen.getByText(/Day \d+/)).toBeInTheDocument()
    expect(screen.getByText(/180 cm/)).toBeInTheDocument()
    expect(screen.getByText(/82\.5 kg/)).toBeInTheDocument()
    expect(screen.getByText(/then/i)).toBeInTheDocument()
  })
})
