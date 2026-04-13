import { ulid } from 'ulid'

/**
 * Generates a ULID (26 chars, time-sortable, URL-safe).
 * Used for: users.id primary key.
 */
export function newUlid(): string {
  return ulid()
}
