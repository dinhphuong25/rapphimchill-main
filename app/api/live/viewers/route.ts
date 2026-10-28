import { NextRequest, NextResponse } from "next/server";

// Edge memory store for active viewer heartbeats
// Map<movieSlug, Map<clientId, lastSeenTimestamp>>
const activeMovieViewers = new Map<string, Map<string, number>>();

const HEARTBEAT_TTL_MS = 45_000; // 45 seconds

// Deterministic seed hash based on slug for realistic base viewer counts
function getBaseViewersForSlug(slug: string): number {
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = (hash << 5) - hash + slug.charCodeAt(i);
    hash |= 0;
  }
  const positiveHash = Math.abs(hash);
  // Base between 15 and 85 viewers
  const base = 15 + (positiveHash % 70);

  // Time-based organic fluctuation (+/- 8 based on 5-minute cycles)
  const minuteBlock = Math.floor(Date.now() / 300_000);
  const cycleVariation = ((positiveHash ^ minuteBlock) % 17) - 8;

  return Math.max(8, base + cycleVariation);
}

function getActiveCount(slug: string): number {
  const now = Date.now();
  const room = activeMovieViewers.get(slug);
  if (!room) return 0;

  let activeCount = 0;
  for (const [clientId, lastSeen] of room.entries()) {
    if (now - lastSeen < HEARTBEAT_TTL_MS) {
      activeCount++;
    } else {
      room.delete(clientId);
    }
  }

  if (room.size === 0) {
    activeMovieViewers.delete(slug);
  }

  return activeCount;
}

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("slug")?.trim();
  if (!slug) {
    return NextResponse.json({ success: false, error: "Missing slug" }, { status: 400 });
  }

  const baseViewers = getBaseViewersForSlug(slug);
  const realViewers = getActiveCount(slug);
  const totalViewers = baseViewers + realViewers;

  return NextResponse.json(
    {
      success: true,
      slug,
      count: totalViewers,
      activeHeartbeats: realViewers,
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=10, max-age=5, stale-while-revalidate=15",
      },
    }
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const slug = (body.slug || "").trim();
    const clientId = (body.clientId || "").trim() || request.headers.get("cf-connecting-ip") || "anon";

    if (!slug) {
      return NextResponse.json({ success: false, error: "Missing slug" }, { status: 400 });
    }

    const now = Date.now();
    let room = activeMovieViewers.get(slug);
    if (!room) {
      room = new Map();
      activeMovieViewers.set(slug, room);
    }

    room.set(clientId, now);

    const baseViewers = getBaseViewersForSlug(slug);
    const realViewers = getActiveCount(slug);
    const totalViewers = baseViewers + realViewers;

    return NextResponse.json({
      success: true,
      slug,
      count: totalViewers,
      activeHeartbeats: realViewers,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || "Internal error" }, { status: 500 });
  }
}
