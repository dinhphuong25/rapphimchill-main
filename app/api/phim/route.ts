import { NextRequest } from "next/server";

// Edge Runtime — responds 50-80ms faster than Node.js
export const runtime = "edge";

// Rate limiting: in-memory store (resets on cold start, which is fine for edge)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 60; // requests per window
const RATE_WINDOW = 60_000; // 1 minute

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_WINDOW });
    return false;
  }

  entry.count++;
  return entry.count > RATE_LIMIT;
}

// Server-side in-memory cache for high concurrency spikes
const memoryCache = new Map<string, { data: string; timestamp: number }>();
const MEMORY_CACHE_TTL = 300_000; // 5 minutes in-memory

export async function GET(req: NextRequest) {
  // Rate limiting
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (isRateLimited(ip)) {
    return new Response(
      JSON.stringify({ error: "Too many requests. Please slow down." }),
      { status: 429, headers: { "Content-Type": "application/json", "Retry-After": "60" } }
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

  if (!parsedUrl.hostname.endsWith("phimapi.com")) {
    return new Response(
      JSON.stringify({ error: "Forbidden host" }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }

  const cacheKey = parsedUrl.toString();
  const now = Date.now();
  const cached = memoryCache.get(cacheKey);

  if (cached && now - cached.timestamp < MEMORY_CACHE_TTL) {
    return new Response(cached.data, {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=86400",
        "X-Cache": "HIT",
        Vary: "Accept",
      },
    });
  }

  try {
    const res = await fetch(parsedUrl.toString(), {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      return new Response(
        JSON.stringify({ error: "Upstream error" }),
        {
          status: res.status,
          headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
        }
      );
    }

    const data = await res.json();
    const jsonString = JSON.stringify(data);

    // Keep memory cache size bounded (< 200 items)
    if (memoryCache.size > 200) {
      const firstKey = memoryCache.keys().next().value;
      if (firstKey) memoryCache.delete(firstKey);
    }
    memoryCache.set(cacheKey, { data: jsonString, timestamp: now });

    return new Response(jsonString, {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=86400",
        "X-Cache": "MISS",
        Vary: "Accept",
      },
    });
  } catch {
    return new Response(
      JSON.stringify({ error: "Fetch failed" }),
      { status: 502, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } }
    );
  }
}
