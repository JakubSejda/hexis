import { describe, it, expect } from 'vitest'
import { hashPassword, verifyPassword } from '@/lib/password'

describe('password hashing', () => {
  it('produces argon2id hash', async () => {
    const hash = await hashPassword('Abcd1234')
    expect(hash).toMatch(/^\$argon2id\$/)
  })

  it('different calls produce different hashes (random salt)', async () => {
    const h1 = await hashPassword('Abcd1234')
    const h2 = await hashPassword('Abcd1234')
    expect(h1).not.toBe(h2)
  })

  it('verifies correct password', async () => {
    const hash = await hashPassword('Abcd1234')
    expect(await verifyPassword(hash, 'Abcd1234')).toBe(true)
  })

  it('rejects wrong password', async () => {
    const hash = await hashPassword('Abcd1234')
    expect(await verifyPassword(hash, 'WrongPass1')).toBe(false)
  })

  it('rejects tampered hash', async () => {
    expect(await verifyPassword('not-a-valid-hash', 'Abcd1234')).toBe(false)
  })
})
