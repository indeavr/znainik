import { sql } from '@vercel/postgres'

/** True when Vercel Postgres / Neon is wired (POSTGRES_URL). */
export const isEngagementPersisted = Boolean(
  process.env.POSTGRES_URL ?? process.env.DATABASE_URL
)

let schemaReady: Promise<void> | null = null

export async function ensureEngagementSchema(): Promise<void> {
  if (!isEngagementPersisted) return
  if (!schemaReady) {
    schemaReady = initSchema()
  }
  await schemaReady
}

async function initSchema(): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS zn_page_totals (
      page_id TEXT PRIMARY KEY,
      views INTEGER NOT NULL DEFAULT 0,
      likes INTEGER NOT NULL DEFAULT 0
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS zn_visitor_likes (
      page_id TEXT NOT NULL,
      visitor_id TEXT NOT NULL,
      count INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (page_id, visitor_id)
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS zn_visitor_views (
      page_id TEXT NOT NULL,
      visitor_id TEXT NOT NULL,
      last_viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (page_id, visitor_id)
    )
  `
}



export {sql} from '@vercel/postgres'