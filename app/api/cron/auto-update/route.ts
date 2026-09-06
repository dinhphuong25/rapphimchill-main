import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { verifyMaintenanceToken } from "@/lib/maintenance";

export async function GET(req: NextRequest) {
  return handleAutoUpdate(req);
}

export async function POST(req: NextRequest) {
  return handleAutoUpdate(req);
}

async function handleAutoUpdate(req: NextRequest) {
  const startTime = Date.now();
  const { searchParams } = req.nextUrl;
  const token = searchParams.get("token") || searchParams.get("secret") || req.headers.get("authorization")?.replace("Bearer ", "");

  // Vercel Cron header support
  const isVercelCron = req.headers.get("x-vercel-cron") === "1";

  if (!isVercelCron && !verifyMaintenanceToken(token)) {
    return NextResponse.json(
      { success: false, error: "Unauthorized. Valid token required." },
      { status: 401 }
    );
  }

  try {
    // 1. Revalidate Next.js ISR static pages
    revalidatePath("/");
    revalidatePath("/new-updates");
    revalidatePath("/recently");
    revalidatePath("/favorites");

    // 2. Fetch fresh new movies to pre-warm cache
    const upstreamUrl = "https://phimapi.com/danh-sach/phim-moi-cap-nhat-v2?page=1&limit=24";
    const res = await fetch(upstreamUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) HiPhimAutoUpdater/1.0",
        Accept: "application/json",
      },
      next: { revalidate: 60 },
    });

    let freshMoviesCount = 0;
    let latestTitles: string[] = [];

    if (res.ok) {
      const data = await res.json();
      const items = data?.items || [];
      freshMoviesCount = items.length;
      latestTitles = items.slice(0, 5).map((m: any) => `${m.name} (${m.year || "2026"})`);
    }

    const durationMs = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      message: "Tự động cập nhật và làm mới bộ nhớ đệm thành công!",
      timestamp: new Date().toISOString(),
      executionTimeMs: durationMs,
      revalidatedPaths: ["/", "/new-updates", "/recently", "/favorites"],
      freshMoviesFound: freshMoviesCount,
      latestUpdates: latestTitles,
    });
  } catch (error: any) {
    console.error("Auto-update cron error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Lỗi trong quá trình tự động cập nhật",
        detail: error?.message,
      },
      { status: 500 }
    );
  }
}
