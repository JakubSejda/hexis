import { hash, verify } from '@node-rs/argon2'

// argon2id with OWASP 2024 recommended parameters for web apps
// - memoryCost: 19 MB (19456 KB)
// - timeCost: 2 iterations
// - parallelism: 1
const ARGON2_OPTIONS = {
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
} as const

export async function hashPassword(plain: string): Promise<string> {
  return hash(plain, ARGON2_OPTIONS)
}

export async function verifyPassword(storedHash: string, plain: string): Promise<boolean> {
  try {
    return await verify(storedHash, plain)
  } catch {
    // Invalid hash format → reject
    return false
  }
}
