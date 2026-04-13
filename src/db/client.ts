import { drizzle, type MySql2Database } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'
import { env } from '@/lib/env'
import * as schema from './schema'

const pool = mysql.createPool({
  uri: env.DATABASE_URL,
  connectionLimit: 10,
})

export const db = drizzle(pool, { schema, mode: 'default' })
export type DB = MySql2Database<typeof schema>
