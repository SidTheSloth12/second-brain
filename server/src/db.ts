import { Pool } from 'pg'

function createPool(): Pool {
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error('DATABASE_URL is required (Supabase: Project Settings → Database → Connection string)')
  }

  const useSsl = process.env.DATABASE_SSL !== 'false'

  return new Pool({
    connectionString: url,
    ssl: useSsl ? { rejectUnauthorized: false } : undefined,
  })
}

export const pool = createPool()
