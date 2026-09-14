import { neon } from "@neondatabase/serverless";

const databaseUrl = process.env.DATABASE_URL?.trim();

export const vercelSql = databaseUrl ? neon(databaseUrl) : null;

let schemaPromise: Promise<void> | null = null;

export async function ensureVercelDatabase(): Promise<boolean> {
  if (!vercelSql) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("DATABASE_URL chưa được cấu hình trên Vercel.");
    }
    return false;
  }
  if (!schemaPromise) {
    schemaPromise = (async () => {
      await vercelSql!`
        CREATE TABLE IF NOT EXISTS hiphim_users (
          email TEXT PRIMARY KEY,
          id TEXT NOT NULL UNIQUE,
          data JSONB NOT NULL
        )
      `;
      await vercelSql!`
        CREATE INDEX IF NOT EXISTS hiphim_users_id_idx ON hiphim_users (id)
      `;
      await vercelSql!`
        CREATE TABLE IF NOT EXISTS hiphim_pending_registrations (
          email TEXT PRIMARY KEY,
          data JSONB NOT NULL,
          expires_at BIGINT NOT NULL
        )
      `;
    })().catch((error) => {
      schemaPromise = null;
      throw error;
    });
  }
  await schemaPromise;
  return true;
}
