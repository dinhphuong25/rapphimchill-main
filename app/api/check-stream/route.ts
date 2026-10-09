import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

// Cache stream checks in-memory on the edge for 60 seconds to avoid repeating checks
const streamStatusCache = new Map<string, { status: number; timestamp: number }>();
const CACHE_TTL_MS = 60_000;

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const targetUrl = searchParams.get("url");

  if (!targetUrl) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(targetUrl);
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  if (parsedUrl.protocol !== "https:" && parsedUrl.protocol !== "http:") {
    return NextResponse.json({ error: "Invalid protocol" }, { status: 400 });
  }

  const cacheKey = targetUrl;
  const now = Date.now();
  const cached = streamStatusCache.get(cacheKey);

  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    const isOk = cached.status >= 200 && cached.status < 400;
    const isSyncing = cached.status === 404;
    return NextResponse.json({
      ok: isOk,
      status: cached.status,
      syncing: isSyncing,
      cached: true,
      message: isSyncing
        ? "Tập phim vừa được đưa lên hệ thống và máy chủ nguồn đang đồng bộ dữ liệu (Mã 404)."
        : isOk
        ? "Đường truyền hoạt động tốt"
        : `Máy chủ phản hồi mã ${cached.status}`,
    });
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(targetUrl, {
      method: "HEAD",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
        Referer: "https://player.phimapi.com/",
        Origin: "https://player.phimapi.com",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const status = res.status;
    streamStatusCache.set(cacheKey, { status, timestamp: now });

    const isOk = status >= 200 && status < 400;
    const isSyncing = status === 404;

    return NextResponse.json({
      ok: isOk,
      status,
      syncing: isSyncing,
      message: isSyncing
        ? "Tập phim vừa được đưa lên hệ thống và máy chủ nguồn đang đồng bộ dữ liệu (Mã 404)."
        : isOk
        ? "Đường truyền hoạt động tốt"
        : `Máy chủ phản hồi mã ${status}`,
    });
  } catch (err: any) {
    const isTimeout = err?.name === "AbortError";
    const status = isTimeout ? 408 : 503;
    streamStatusCache.set(cacheKey, { status, timestamp: now });

    return NextResponse.json({
      ok: false,
      status,
      syncing: false,
      message: isTimeout
        ? "Kết nối tới máy chủ nguồn video bị gián đoạn (quá thời gian chờ)."
        : "Không thể kết nối tới máy chủ nguồn video.",
    });
  }
}
