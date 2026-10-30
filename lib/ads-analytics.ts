import fs from "fs";
import path from "path";
import { getD1Database } from "@/lib/d1-db";

export type AdPlacement = "popup" | "catfish" | "tvc";
export type AdEvent = "impression" | "click";

export interface DailyAdStat {
  date: string; // YYYY-MM-DD
  placement: AdPlacement;
  impressions: number;
  clicks: number;
}

export interface PlacementSummary {
  impressions: number;
  clicks: number;
  ctr: number; // percentage, e.g. 3.25
}

export interface AdsAnalyticsSummary {
  today: {
    impressions: number;
    clicks: number;
    ctr: number;
  };
  last7Days: {
    impressions: number;
    clicks: number;
    ctr: number;
  };
  allTime: {
    impressions: number;
    clicks: number;
    ctr: number;
  };
  placements: {
    popup: PlacementSummary;
    catfish: PlacementSummary;
    tvc: PlacementSummary;
  };
  recentHistory: Array<{
    date: string;
    impressions: number;
    clicks: number;
    ctr: number;
  }>;
}

const STATS_FILE_PATH = path.join(process.cwd(), "data", "ads-stats.json");

function getTodayString(): string {
  const d = new Date();
  return d.toISOString().split("T")[0]; // YYYY-MM-DD
}

function ensureStatsFileExists(): void {
  const dir = path.dirname(STATS_FILE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(STATS_FILE_PATH)) {
    fs.writeFileSync(STATS_FILE_PATH, JSON.stringify([], null, 2), "utf-8");
  }
}

function readStatsFromFile(): DailyAdStat[] {
  try {
    ensureStatsFileExists();
    const raw = fs.readFileSync(STATS_FILE_PATH, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function writeStatsToFile(stats: DailyAdStat[]): void {
  try {
    ensureStatsFileExists();
    fs.writeFileSync(STATS_FILE_PATH, JSON.stringify(stats, null, 2), "utf-8");
  } catch (err) {
    console.warn("[AdsStats] Failed to write file:", err);
  }
}

let d1TableInitialized = false;

async function ensureD1Table(): Promise<boolean> {
  if (d1TableInitialized) return true;
  const d1 = await getD1Database();
  if (!d1) return false;
  try {
    await d1
      .prepare(
        `CREATE TABLE IF NOT EXISTS hiphim_ads_stats (
          id TEXT PRIMARY KEY,
          date TEXT NOT NULL,
          placement TEXT NOT NULL,
          impressions INTEGER DEFAULT 0,
          clicks INTEGER DEFAULT 0,
          updated_at INTEGER
        )`
      )
      .run();
    await d1
      .prepare(`CREATE INDEX IF NOT EXISTS idx_hiphim_ads_stats_date ON hiphim_ads_stats (date)`)
      .run();
    d1TableInitialized = true;
    return true;
  } catch (err) {
    console.warn("[D1] Could not create ads stats table:", err);
    return false;
  }
}

/**
 * Record an ad impression or click event
 */
export async function recordAdEvent(placement: AdPlacement, event: AdEvent): Promise<boolean> {
  const today = getTodayString();
  const id = `${today}_${placement}`;
  const now = Date.now();

  // 1. Try Cloudflare D1
  const d1 = await getD1Database();
  if (d1 && (await ensureD1Table())) {
    try {
      const impAdd = event === "impression" ? 1 : 0;
      const clkAdd = event === "click" ? 1 : 0;
      await d1
        .prepare(
          `INSERT INTO hiphim_ads_stats (id, date, placement, impressions, clicks, updated_at)
           VALUES (?, ?, ?, ?, ?, ?)
           ON CONFLICT (id) DO UPDATE SET
             impressions = impressions + ?,
             clicks = clicks + ?,
             updated_at = ?`
        )
        .bind(id, today, placement, impAdd, clkAdd, now, impAdd, clkAdd, now)
        .run();
      return true;
    } catch (err) {
      console.warn("[D1] Error recording ad event, falling back to local:", err);
    }
  }

  // 2. Fallback to local file
  const stats = readStatsFromFile();
  const idx = stats.findIndex((s) => s.date === today && s.placement === placement);
  if (idx !== -1) {
    if (event === "impression") {
      stats[idx].impressions = (stats[idx].impressions || 0) + 1;
    } else {
      stats[idx].clicks = (stats[idx].clicks || 0) + 1;
    }
  } else {
    stats.push({
      date: today,
      placement,
      impressions: event === "impression" ? 1 : 0,
      clicks: event === "click" ? 1 : 0,
    });
  }
  writeStatsToFile(stats);
  return true;
}

/**
 * Get comprehensive analytics summary for Admin dashboard
 */
export async function getAdsAnalyticsSummary(): Promise<AdsAnalyticsSummary> {
  const today = getTodayString();
  let rawStats: DailyAdStat[] = [];

  // 1. Try D1
  const d1 = await getD1Database();
  if (d1 && (await ensureD1Table())) {
    try {
      const { results } = await d1
        .prepare(`SELECT date, placement, impressions, clicks FROM hiphim_ads_stats ORDER BY date DESC`)
        .all<DailyAdStat>();
      if (results && results.length > 0) {
        rawStats = results;
      }
    } catch (err) {
      console.warn("[D1] Error fetching ads stats, using local file:", err);
    }
  }

  // 2. Fallback to local file if D1 has no records
  if (rawStats.length === 0) {
    rawStats = readStatsFromFile();
  }

  // Calculate past 7 days threshold
  const d7 = new Date();
  d7.setDate(d7.getDate() - 7);
  const sevenDaysAgoStr = d7.toISOString().split("T")[0];

  let todayImp = 0;
  let todayClk = 0;

  let last7Imp = 0;
  let last7Clk = 0;

  let allImp = 0;
  let allClk = 0;

  const placementsMap: Record<AdPlacement, { impressions: number; clicks: number }> = {
    popup: { impressions: 0, clicks: 0 },
    catfish: { impressions: 0, clicks: 0 },
    tvc: { impressions: 0, clicks: 0 },
  };

  const dailyHistoryMap = new Map<string, { impressions: number; clicks: number }>();

  for (const item of rawStats) {
    const imp = Number(item.impressions) || 0;
    const clk = Number(item.clicks) || 0;
    const pl = (item.placement as AdPlacement) || "popup";

    allImp += imp;
    allClk += clk;

    if (placementsMap[pl]) {
      placementsMap[pl].impressions += imp;
      placementsMap[pl].clicks += clk;
    }

    if (item.date === today) {
      todayImp += imp;
      todayClk += clk;
    }

    if (item.date >= sevenDaysAgoStr) {
      last7Imp += imp;
      last7Clk += clk;

      const cur = dailyHistoryMap.get(item.date) || { impressions: 0, clicks: 0 };
      dailyHistoryMap.set(item.date, {
        impressions: cur.impressions + imp,
        clicks: cur.clicks + clk,
      });
    }
  }

  const calcCtr = (clicks: number, impressions: number) =>
    impressions > 0 ? Number(((clicks / impressions) * 100).toFixed(2)) : 0;

  const recentHistory = Array.from(dailyHistoryMap.entries())
    .map(([date, data]) => ({
      date,
      impressions: data.impressions,
      clicks: data.clicks,
      ctr: calcCtr(data.clicks, data.impressions),
    }))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 7);

  return {
    today: {
      impressions: todayImp,
      clicks: todayClk,
      ctr: calcCtr(todayClk, todayImp),
    },
    last7Days: {
      impressions: last7Imp,
      clicks: last7Clk,
      ctr: calcCtr(last7Clk, last7Imp),
    },
    allTime: {
      impressions: allImp,
      clicks: allClk,
      ctr: calcCtr(allClk, allImp),
    },
    placements: {
      popup: {
        impressions: placementsMap.popup.impressions,
        clicks: placementsMap.popup.clicks,
        ctr: calcCtr(placementsMap.popup.clicks, placementsMap.popup.impressions),
      },
      catfish: {
        impressions: placementsMap.catfish.impressions,
        clicks: placementsMap.catfish.clicks,
        ctr: calcCtr(placementsMap.catfish.clicks, placementsMap.catfish.impressions),
      },
      tvc: {
        impressions: placementsMap.tvc.impressions,
        clicks: placementsMap.tvc.clicks,
        ctr: calcCtr(placementsMap.tvc.clicks, placementsMap.tvc.impressions),
      },
    },
    recentHistory,
  };
}
