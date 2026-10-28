import { neon } from "@neondatabase/serverless";

function getDatabaseUrl(): string | undefined {
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

  return undefined;
}

const databaseUrl = getDatabaseUrl();

export const vercelSql = databaseUrl ? neon(databaseUrl) : null;

/**
 * Super-fast check: returns true if database connection is configured.
 * Bảng dữ liệu đã được tạo sẵn trong Neon PostgreSQL nên không chạy lại DDL thừa.
 */
export async function ensureVercelDatabase(): Promise<boolean> {
  if (!vercelSql) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("DATABASE_URL hoặc POSTGRES_URL chưa được cấu hình.");
    }
    return false;
  }
  return true;
}
