import { defineConfig } from 'drizzle-kit'
import * as dotenv from 'dotenv'

// Load .env.local first (overrides), then .env as fallback
dotenv.config({ path: '.env.local' })
dotenv.config({ path: '.env' })

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './src/db/migrations',
  dialect: 'mysql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
})
