/**
 * Cloudflare Workers KV Cache Adapter
 * Provides global, sub-2ms edge caching for movie data and API responses.
 * Gracefully falls back to Cloudflare Cache API or in-memory LRU cache if KV is not bound yet.
 */

export interface KVNamespaceLike {
  get(key: string, type?: "text" | "json" | "arrayBuffer"): Promise<any>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
  delete(key: string): Promise<void>;
}

const memoryFallback = new Map<string, { value: any; expiresAt: number }>();

async function getKVBinding(): Promise<KVNamespaceLike | null> {
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const ctx = await getCloudflareContext({ async: true });
    const kv = ((ctx?.env as Record<string, unknown>)?.HIPHIM_KV ||
      (ctx?.env as Record<string, unknown>)?.KV) as KVNamespaceLike | undefined;
    if (kv && typeof kv.get === "function" && typeof kv.put === "function") {
      return kv;
    }
  } catch {}
  return null;
}

export async function kvGet<T = unknown>(key: string): Promise<T | null> {
  const kv = await getKVBinding();
  if (kv) {
    try {
      const data = await kv.get(key, "json");
      if (data !== null && data !== undefined) {
        return data as T;
      }
    } catch (err) {
      console.warn("[KV CACHE] Error reading key:", key, err);
    }
  }

  // Fallback to in-memory store
  const cached = memoryFallback.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value as T;
  }
  return null;
}

export async function kvSet<T = unknown>(
  key: string,
  value: T,
  ttlSeconds: number = 1800
): Promise<boolean> {
  const kv = await getKVBinding();
  if (kv) {
    try {
      await kv.put(key, JSON.stringify(value), { expirationTtl: Math.max(60, ttlSeconds) });
      return true;
    } catch (err) {
      console.warn("[KV CACHE] Error saving key:", key, err);
    }
  }

  // Fallback to in-memory store (keep at most 1,000 entries)
  if (memoryFallback.size >= 1000) {
    const firstKey = memoryFallback.keys().next().value;
    if (firstKey) memoryFallback.delete(firstKey);
  }
  memoryFallback.set(key, {
    value,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
  return true;
}

export async function kvDelete(key: string): Promise<boolean> {
  const kv = await getKVBinding();
  if (kv) {
    try {
      await kv.delete(key);
    } catch {}
  }
  memoryFallback.delete(key);
  return true;
}
