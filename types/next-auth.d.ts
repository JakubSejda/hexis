import type { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      level?: number
    } & DefaultSession['user']
  }

  interface User {
    id: string
    email: string
    name?: string | null
    level?: number
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    userId: string
    email: string
    level?: number
  }
}
