import { describe, it, expect } from 'vitest'
import { emailSchema, passwordSchema, loginSchema } from '@/lib/validation'

describe('emailSchema', () => {
  it('accepts valid email', () => {
    expect(emailSchema.safeParse('jakub@example.com').success).toBe(true)
  })

  it('rejects invalid email', () => {
    expect(emailSchema.safeParse('not-an-email').success).toBe(false)
  })

  it('rejects empty string', () => {
    expect(emailSchema.safeParse('').success).toBe(false)
  })

  it('lowercases email on parse', () => {
    const r = emailSchema.parse('JAKUB@Example.COM')
    expect(r).toBe('jakub@example.com')
  })
})

describe('passwordSchema', () => {
  it('accepts 8+ chars with upper and digit', () => {
    expect(passwordSchema.safeParse('Abcd1234').success).toBe(true)
  })

  it('rejects under 8 chars', () => {
    expect(passwordSchema.safeParse('Abc123').success).toBe(false)
  })

  it('rejects without uppercase', () => {
    expect(passwordSchema.safeParse('abcd1234').success).toBe(false)
  })

  it('rejects without digit', () => {
    expect(passwordSchema.safeParse('Abcdefgh').success).toBe(false)
  })
})

describe('loginSchema', () => {
  it('accepts valid credentials', () => {
    const r = loginSchema.safeParse({
      email: 'jakub@example.com',
      password: 'Abcd1234',
    })
    expect(r.success).toBe(true)
  })

  it('rejects missing password', () => {
    const r = loginSchema.safeParse({ email: 'jakub@example.com' })
    expect(r.success).toBe(false)
  })
})
