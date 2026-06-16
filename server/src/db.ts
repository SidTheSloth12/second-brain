import { Pool } from'pg'
import { PrismaClient } from'@prisma/client'
import { PrismaPg } from'@prisma/adapter-pg'
function createPool(): Pool {
  const url=process.env.DATABASE_URL
  if (!url) {
    throw new Error('DATABASE_URL is required (Supabase: Project Settings → Database → Connection string)')
  }
  const useSsl=process.env.DATABASE_SSL!=='false'
  return new Pool({
    connectionString: url,
    ssl: useSsl ? { rejectUnauthorized: false } : undefined,
  })
}
export const pool=createPool()
const adapter=new PrismaPg(pool)
const globalForPrisma=global as unknown as { prisma: PrismaClient }
export const prisma=globalForPrisma.prisma||new PrismaClient({ adapter })
if (process.env.NODE_ENV!=='production') globalForPrisma.prisma=prisma