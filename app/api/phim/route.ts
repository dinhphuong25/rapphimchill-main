import { NextRequest } from "next/server";

// Edge Runtime — responds 50-80ms faster than Node.js with zero cold-start latency
export const runtime = "edge";

// Rate limiting: in-memory store per Edge worker node
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 180; // Allow 180 requests per minute per IP (high-concurrency friendly for NAT/shared networks)
const RATE_WINDOW = 60_000; // 1 minute

function isRateLimited(ip: string): boolean {
  if (ip === "unknown" || ip === "127.0.0.1" || ip === "::1") return false;
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_WINDOW });
    return false;
  }

  entry.count++;
  return entry.count > RATE_LIMIT;
}

// Multi-tier In-Memory LRU Cache for Spikes
interface CacheEntry {
  data: string;
  timestamp: number;
  lastAccessed: number;
}

const memoryCache = new Map<string, CacheEntry>();
const MEMORY_CACHE_TTL = 600_000; // 10 minutes in-memory
const MAX_CACHE_ENTRIES = 1000; // High capacity for thousands of movie requests

// Single-flight / In-Flight Request Deduplication:
// If 1,000 users request the same movie at the same instant, only ONE fetch goes upstream.
const inFlightRequests = new Map<string, Promise<string>>();

function evictOldestEntry() {
  let oldestKey: string | null = null;
  let oldestTime = Infinity;
  for (const [key, entry] of memoryCache.entries()) {
    if (entry.lastAccessed < oldestTime) {
      oldestTime = entry.lastAccessed;
      oldestKey = key;
    }
  }
  if (oldestKey) {
    memoryCache.delete(oldestKey);
  }
}

export async function GET(req: NextRequest) {
  // Extract accurate client IP behind Cloudflare / Proxy
  const ip =
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";

  if (isRateLimited(ip)) {
    return new Response(
      JSON.stringify({ error: "Too many requests. Please slow down." }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": "30",
          "Cache-Control": "no-store",
        },
      }
    );
  }

  const { searchParams } = req.nextUrl;
  const urlParam = searchParams.get("url");

  if (!urlParam) {
    return new Response(
      JSON.stringify({ error: "Missing url param" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(urlParam);
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid url" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const ALLOWED_HOSTS = ["phimapi.com", "phim.nguonc.com"];
  const isAllowedHost = ALLOWED_HOSTS.some((h) => parsedUrl.hostname.endsWith(h));
  if (!isAllowedHost) {
    return new Response(
      JSON.stringify({ error: "Forbidden host" }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }

  const cacheKey = parsedUrl.toString();
  const now = Date.now();
  const cached = memoryCache.get(cacheKey);
  const isNewUpdates = parsedUrl.pathname.includes("phim-moi-cap-nhat") || parsedUrl.search.includes("phim-moi-cap-nhat");
  const isMovieDetail = parsedUrl.pathname.startsWith("/phim/");
  const isRealtime = isNewUpdates || isMovieDetail;
  const currentTTL = isRealtime ? 60_000 : MEMORY_CACHE_TTL;

  // 1. Return from In-Memory Cache if fresh
  if (cached && now - cached.timestamp < currentTTL) {
    cached.lastAccessed = now;
    return new Response(cached.data, {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": isRealtime 
          ? "public, s-maxage=60, stale-while-revalidate=120"
          : "public, s-maxage=3600, stale-while-revalidate=86400",
        "X-Cache": "HIT-MEMORY",
        Vary: "Accept-Encoding",
      },
    });
  }

  // 2. In-Flight Request Deduplication (Prevents Thundering Herd Problem)
  try {
    let pendingFetch = inFlightRequests.get(cacheKey);

    if (!pendingFetch) {
      pendingFetch = (async () => {
        let res: Response | null = null;
        let lastError: any = null;

        // Try primary fetch with 6s timeout
        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 6000);
          res = await fetch(parsedUrl.toString(), {
            signal: controller.signal,
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
              Accept: "application/json",
            },
          });
          clearTimeout(timer);
        } catch (err) {
          lastError = err;
        }

        // If primary failed or returned error, and it's a movie detail request, fallback to NguonC
        if ((!res || !res.ok) && isMovieDetail) {
          const slug = parsedUrl.pathname.replace(/^\/phim\//, "").replace(/\/$/, "");
          if (slug) {
            try {
              const fbUrl = `https://phim.nguonc.com/api/film/${slug}`;
              const fbRes = await fetch(fbUrl, {
                headers: {
                  "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
                  Accept: "application/json",
                },
              });
              if (fbRes.ok) {
                const fbData = await fbRes.json();
                if (fbData.movie && fbData.movie.slug) {
                  const mapped = {
                    status: true,
                    msg: "success (fallback)",
                    movie: {
                      name: fbData.movie.name,
                      slug: fbData.movie.slug,
                      origin_name: fbData.movie.original_name,
                      content: fbData.movie.description,
                      thumb_url: fbData.movie.thumb_url,
                      poster_url: fbData.movie.poster_url,
                      year: fbData.movie.created ? new Date(fbData.movie.created).getFullYear() : 2026,
                      episode_current: fbData.movie.current_episode,
                      quality: fbData.movie.quality || "HD",
                      lang: fbData.movie.language || "Vietsub",
                    },
                    episodes: (fbData.movie.episodes || []).map((s: any) => ({
                      server_name: s.server_name || "Dự Phòng (NguonC)",
                      server_data: (s.items || []).map((it: any) => ({
                        name: it.name?.startsWith("Tập") ? it.name : `Tập ${it.name}`,
                        slug: it.slug,
                        filename: it.name,
                        link_embed: it.embed,
                        link_m3u8: "",
                      })),
                    })),
                  };
                  return JSON.stringify(mapped);
                }
              }
            } catch {}
          }
        }

        if (!res || !res.ok) {
          throw lastError || new Error(`Upstream returned ${res?.status || 500}`);
        }

        const data = await res.json();
        return JSON.stringify(data);
      })()
        .catch((err) => {
          inFlightRequests.delete(cacheKey);
          throw err;
        })
        .finally(() => {
          inFlightRequests.delete(cacheKey);
        });

      inFlightRequests.set(cacheKey, pendingFetch);
    }

    const jsonString = await pendingFetch;

    // Cache the result
    if (memoryCache.size >= MAX_CACHE_ENTRIES) {
      evictOldestEntry();
    }
    memoryCache.set(cacheKey, {
      data: jsonString,
      timestamp: now,
      lastAccessed: now,
    });

    return new Response(jsonString, {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": isRealtime 
          ? "public, s-maxage=60, stale-while-revalidate=120"
          : "public, s-maxage=3600, stale-while-revalidate=86400",
        "X-Cache": "MISS-UPSTREAM",
        Vary: "Accept-Encoding",
      },
    });
  } catch (error: any) {
    // If upstream failed but we have stale cache, serve stale cache as graceful fallback!
    if (cached) {
      return new Response(cached.data, {
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "public, max-age=60",
          "X-Cache": "STALE-FALLBACK",
        },
      });
    }

    return new Response(
      JSON.stringify({ error: "Failed to fetch upstream media data" }),
      {
        status: 502,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
      }
    );
  }
}
