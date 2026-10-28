import { neon } from "@neondatabase/serverless";

export const FALLBACK_DATABASE_URL =
  "postgresql://neondb_owner:npg_ImaUR5q9jhyF@ep-tiny-wave-awkfe27v-pooler.c-12.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require";

export function getDatabaseUrl(): string {
  const primary = (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL
  )?.trim();
  if (primary) return primary;

  // Tự động tìm bất kỳ biến môi trường nào chứa chuỗi postgresql://
  for (const [key, val] of Object.entries(process.env)) {
    if (typeof val === "string" && val.trim().startsWith("postgresql://")) {
      return val.trim();
    }
  }

  return FALLBACK_DATABASE_URL;
}

let _cachedSql: any = null;
let _cachedUrl = "";

export function getVercelSql() {
  const url = getDatabaseUrl();
  if (!_cachedSql || _cachedUrl !== url) {
    _cachedUrl = url;
    _cachedSql = neon(url);
  }
  return _cachedSql;
}

/**
 * Dynamic Proxy for vercelSql so that every SQL query dynamically evaluates neon(getDatabaseUrl())
 * without failing on Worker isolate cold starts.
 */
export const vercelSql: any = new Proxy(
  function () {},
  {
    apply(_target, thisArg, argArray) {
      const sql = getVercelSql();
      return Reflect.apply(sql, thisArg, argArray);
    },
    get(_target, prop) {
      const sql = getVercelSql();
      return Reflect.get(sql, prop);
    },
  }
);

let hasCreatedIndex = false;

/**
 * Super-fast check: returns true if database connection is configured.
 * Bảng dữ liệu đã được tạo sẵn trong Neon PostgreSQL nên không chạy lại DDL thừa.
 */
export async function ensureVercelDatabase(): Promise<boolean> {
  const sql = getVercelSql();
  if (!sql) return false;
  if (!hasCreatedIndex) {
    hasCreatedIndex = true;
    (async () => {
      try {
        await sql`CREATE INDEX IF NOT EXISTS hiphim_users_id_idx ON hiphim_users (id)`;
      } catch {}
    })();
  }
  return true;
}
