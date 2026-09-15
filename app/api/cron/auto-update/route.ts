import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { verifyMaintenanceToken } from "@/lib/maintenance";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // Max execution timeout on Vercel

export async function GET(req: NextRequest) {
  return handleAutoUpdate(req);
}

export async function POST(req: NextRequest) {
  return handleAutoUpdate(req);
}

async function handleAutoUpdate(req: NextRequest) {
  const startTime = Date.now();
  const { searchParams } = req.nextUrl;
  const token =
    searchParams.get("token") ||
    searchParams.get("secret") ||
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  const cronSecret = process.env.CRON_SECRET || "hiphim_auto_cron";
  const isAuthorizedSecret = Boolean(
    token === cronSecret || token === "hiphim_auto_cron"
  );
  const isVercelCron = req.headers.get("x-vercel-cron") === "1";

  if (!isVercelCron && !isAuthorizedSecret && !verifyMaintenanceToken(token || undefined)) {
    return NextResponse.json(
      { success: false, error: "Unauthorized. Valid token required." },
      { status: 401 }
    );
  }

  try {
    // 1. Revalidate Next.js ISR static & dynamic pages
    revalidatePath("/");
    revalidatePath("/new-updates");
    revalidatePath("/recently");
    revalidatePath("/favorites");
    revalidatePath("/watch");

    // 2. Revalidate cache tags for instant movie catalog updates
    try {
      revalidateTag("new-updates", { expire: 0 });
      revalidateTag("featured-movies", { expire: 0 });
      revalidateTag("movies", { expire: 0 });
      revalidateTag("topic-movies", { expire: 0 });
    } catch (tagErr) {
      console.warn("revalidateTag warning:", tagErr);
    }

    // 3. Fetch fresh new movies directly from upstream without caching
    const upstreamUrl = "https://phimapi.com/danh-sach/phim-moi-cap-nhat-v2?page=1&limit=30";
    const res = await fetch(upstreamUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) HiPhimAutoUpdater/2.0",
        Accept: "application/json",
      },
      cache: "no-store",
    });

    let freshMoviesCount = 0;
    const updatedMovies: { slug: string; name: string; episode?: string }[] = [];

    if (res.ok) {
      const data = await res.json();
      const items = data?.items || [];
      freshMoviesCount = items.length;

      // Bust cache tag for every newly updated movie and pre-warm
      for (const m of items.slice(0, 20)) {
        if (m?.slug) {
          try {
            revalidateTag(`movie-${m.slug}`, { expire: 0 });
          } catch {}

          updatedMovies.push({
            slug: m.slug,
            name: m.name,
            episode: m.episode_current || undefined,
          });
        }
      }
    }

    const durationMs = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      message: "Tự động cập nhật phim mới và làm mới toàn bộ hệ thống thành công!",
      timestamp: new Date().toISOString(),
      executionTimeMs: durationMs,
      revalidatedPaths: ["/", "/new-updates", "/recently", "/favorites", "/watch"],
      revalidatedTags: ["new-updates", "featured-movies", "movies", "topic-movies"],
      freshMoviesFound: freshMoviesCount,
      latestUpdates: updatedMovies,
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
