import { neon } from "@neondatabase/serverless";
import fs from "fs";
import path from "path";

const databaseUrl = (
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_PRISMA_URL
)?.trim();

export const vercelSql = databaseUrl ? neon(databaseUrl) : null;

let schemaPromise: Promise<void> | null = null;

export async function ensureVercelDatabase(): Promise<boolean> {
  if (!vercelSql) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("DATABASE_URL hoặc POSTGRES_URL chưa được cấu hình trên Vercel.");
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

      // Tự động seed tài khoản từ data/users.json sang PostgreSQL
      try {
        const usersFile = path.join(process.cwd(), "data", "users.json");
        if (fs.existsSync(usersFile)) {
          const raw = fs.readFileSync(usersFile, "utf-8");
          const localUsers = JSON.parse(raw);
          if (Array.isArray(localUsers)) {
            for (const user of localUsers) {
              if (user?.email && user?.id) {
                await vercelSql!`
                  INSERT INTO hiphim_users (email, id, data)
                  VALUES (${user.email.toLowerCase()}, ${user.id}, ${JSON.stringify(user)}::jsonb)
                  ON CONFLICT (email) DO NOTHING
                `;
              }
            }
          }
        }
      } catch (seedErr) {
        console.warn("[DB] Could not seed default users from users.json:", seedErr);
      }
    })().catch((error) => {
      schemaPromise = null;
      throw error;
    });
  }
  await schemaPromise;
  return true;
}
