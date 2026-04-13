// src/lib/auth.ts
import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import { DrizzleAdapter } from '@auth/drizzle-adapter'
import { eq } from 'drizzle-orm'
import type { JWT } from 'next-auth/jwt'
import { db } from '@/db/client'
import { users } from '@/db/schema'
import { env } from '@/lib/env'
import { verifyPassword } from '@/lib/password'
import { loginSchema } from '@/lib/validation'

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db),
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: env.AUTH_SECRET,
  pages: {
    signIn: '/login',
  },
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(rawCredentials) {
        const parsed = loginSchema.safeParse(rawCredentials)
        if (!parsed.success) return null

        const { email, password } = parsed.data
        const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1)

        if (!user?.passwordHash) return null

        const ok = await verifyPassword(user.passwordHash, password)
        if (!ok) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          level: user.level,
        }
      },
    }),
    ...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
      ? [
          Google({
            clientId: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET,
            allowDangerousEmailAccountLinking: true, // email = identity
          }),
        ]
      : []),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id as string
        token.email = user.email!
        token.level = (user as { level?: number }).level
      }
      return token
    },
    async session({ session, token }) {
      const t = token as JWT
      if (session.user) {
        session.user.id = t.userId
        session.user.email = t.email
        session.user.level = t.level
      }
      return session
    },
  },
})
