import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { eq, like } from 'drizzle-orm'
import { db } from '@/db/client'
import { users } from '@/db/schema'
import { fetchProfile } from '@/lib/queries/profile'

const PREFIX = 'profq_'
const USER = `${PREFIX}user00000000000001`

beforeAll(async () => {
  await db.delete(users).where(like(users.id, `${PREFIX}%`))
})

afterAll(async () => {
  await db.delete(users).where(like(users.id, `${PREFIX}%`))
})

beforeEach(async () => {
  await db.delete(users).where(like(users.id, `${PREFIX}%`))
  await db.insert(users).values({ id: USER, email: `${PREFIX}p@hexis.local` })
})

describe('fetchProfile', () => {
  it('returns null-filled profile for fresh user', async () => {
    const profile = await fetchProfile(db, USER)
    expect(profile).toEqual({
      name: null,
      birthDate: null,
      gender: null,
      heightCm: null,
      goalKg: null,
      goalText: null,
      startedAt: null,
    })
  })

  it('returns populated profile when fields are set', async () => {
    await db
      .update(users)
      .set({
        name: 'Jakub',
        birthDate: '1990-01-15',
        gender: 'male',
        heightCm: 180,
        goalKg: '78.50',
        goalText: 'Pull 10 reps na 100 kg',
        startedAt: '2024-06-01',
      })
      .where(eq(users.id, USER))
    const profile = await fetchProfile(db, USER)
    expect(profile?.name).toBe('Jakub')
    expect(profile?.birthDate).toBe('1990-01-15')
    expect(profile?.gender).toBe('male')
    expect(profile?.heightCm).toBe(180)
    expect(Number(profile?.goalKg)).toBe(78.5)
    expect(profile?.goalText).toBe('Pull 10 reps na 100 kg')
    expect(profile?.startedAt).toBe('2024-06-01')
  })

  it('returns null when user does not exist', async () => {
    const profile = await fetchProfile(db, `${PREFIX}nonexistent`)
    expect(profile).toBeNull()
  })
})
