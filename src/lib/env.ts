import { z } from 'zod'

const EnvSchema = z.object({
  DATABASE_URL: z.string().url(),
  TEST_DATABASE_URL: z.string().url().optional(),
  AUTH_SECRET: z.string().min(1),
  NEXTAUTH_URL: z.string().url(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  STORAGE_ROOT: z.string().default('./uploads'),
})

export const env = EnvSchema.parse(process.env)
export type Env = z.infer<typeof EnvSchema>
