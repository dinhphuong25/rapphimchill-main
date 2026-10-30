import fs from "fs";
import path from "path";
import { vercelSql } from "@/lib/vercel-db";
import { getD1Database } from "@/lib/d1-db";

export interface SiteConfig {
  siteName: string;
  siteDescription: string;
  contactTelegram?: string;
  contactEmail?: string;
  announcement: {
    enabled: boolean;
    text: string;
    link?: string;
    type: "info" | "warning" | "success";
  };
  featuredSlugs: string[];
  autoPinNewMovies?: boolean;
  autoPinLimit?: number;
  maintenance: {
    enabled: boolean;
    reason: string;
    estimatedEndTime?: string;
  };
  player: {
    defaultMode: "m3u8" | "embed";
    autoplay: boolean;
    defaultVolume: number;
  };
  customFooterText?: string;
  ads?: {
    enabled?: boolean;
    targetUrl?: string;
    popupImage?: string;
    bottomBannerImage?: string;
    showPopup?: boolean;
    showBottomBanner?: boolean;
    tvcEnabled?: boolean;
    tvcVideoUrl?: string;
    tvcSkipAfterSeconds?: number;
    adShieldEnabled?: boolean;
    adShieldMode?: "auto" | "always";
    adDisclaimerEnabled?: boolean;
  };
}

export const DEFAULT_SITE_CONFIG: SiteConfig = {
  siteName: "Hi Phim",
  siteDescription: "Hi Phim - Nền tảng xem phim trực tuyến hàng đầu với hơn 50.000+ tựa phim điện ảnh, phim bộ, anime vietsub chất lượng cao.",
  contactTelegram: "https://t.me/hiphim_support",
  contactEmail: "contact@hiphim.one",
  announcement: {
    enabled: false,
    text: "Chào mừng bạn đến với Hi Phim! Chúc bạn có những phút giây xem phim thư giãn tuyệt vời.",
    link: "",
    type: "info",
  },
  featuredSlugs: [
    "nguoi-nhen-khoi-dau-moi",
    "godzilla-x-kong-de-che-moi",
    "deadpool-va-wolverine",
    "quat-mo-trung-ma",
    "arcane-lien-minh-huyen-thoai-phan-2",
    "nu-hoang-nuoc-mat",
    "avatar-lua-va-tro-tan",
  ],
  autoPinNewMovies: true,
  autoPinLimit: 5,
  maintenance: {
    enabled: false,
    reason: "Hệ thống đang được nâng cấp định kỳ để cải thiện trải nghiệm xem phim.",
    estimatedEndTime: "",
  },
  player: {
    defaultMode: "m3u8",
    autoplay: true,
    defaultVolume: 1,
  },
  customFooterText: "Hi Phim — Nền tảng xem phim miễn phí.",
  ads: {
    enabled: true,
    targetUrl: "https://154.82.109.157/2138063.html",
    popupImage: "/ads/popup.jpg",
    bottomBannerImage: "/ads/banner-bottom.gif",
    showPopup: true,
    showBottomBanner: true,
    tvcEnabled: true,
    tvcVideoUrl: "https://bf.333xbet.com/18881999/video9922.mp4",
    tvcSkipAfterSeconds: 5,
    adShieldEnabled: false,
    adShieldMode: "auto",
    adDisclaimerEnabled: false,
  },
};

declare global {
  // eslint-disable-next-line no-var
  var __HIPHIM_SITE_CONFIG__: SiteConfig | undefined;
  // eslint-disable-next-line no-var
  var __HIPHIM_SITE_CONFIG_TS__: number | undefined;
  // eslint-disable-next-line no-var
  var __HIPHIM_SITE_CONFIG_PROMISE__: Promise<SiteConfig> | undefined;
}

const CONFIG_FILE_PATH = path.join(process.cwd(), "data", "site-config.json");
const CONFIG_MEMORY_TTL = 20_000; // 20s memory cache per Worker isolate

function mergeWithDefaults(parsed: any): SiteConfig {
  if (!parsed || typeof parsed !== "object") return DEFAULT_SITE_CONFIG;
  return {
    ...DEFAULT_SITE_CONFIG,
    ...parsed,
    announcement: {
      ...DEFAULT_SITE_CONFIG.announcement,
      ...(parsed.announcement || {}),
    },
    maintenance: {
      ...DEFAULT_SITE_CONFIG.maintenance,
      ...(parsed.maintenance || {}),
    },
    player: {
      ...DEFAULT_SITE_CONFIG.player,
      ...(parsed.player || {}),
    },
    ads: {
      ...DEFAULT_SITE_CONFIG.ads,
      ...(parsed.ads || {}),
    },
  };
}

/**
 * Reads the site configuration synchronously from memory or local file,
 * and triggers an asynchronous DB hydration if the isolate is cold.
 */
export function getSiteConfig(): SiteConfig {
  if (globalThis.__HIPHIM_SITE_CONFIG__) {
    if (
      !globalThis.__HIPHIM_SITE_CONFIG_TS__ ||
      Date.now() - globalThis.__HIPHIM_SITE_CONFIG_TS__ > CONFIG_MEMORY_TTL
    ) {
      getSiteConfigAsync().catch(() => {});
    }
    return globalThis.__HIPHIM_SITE_CONFIG__;
  }

  try {
    if (fs.existsSync(CONFIG_FILE_PATH)) {
      const fileData = fs.readFileSync(CONFIG_FILE_PATH, "utf-8");
      const parsed = JSON.parse(fileData);
      const merged = mergeWithDefaults(parsed);
      globalThis.__HIPHIM_SITE_CONFIG__ = merged;
      globalThis.__HIPHIM_SITE_CONFIG_TS__ = Date.now();
      getSiteConfigAsync().catch(() => {});
      return merged;
    }
  } catch (err) {
    console.warn("Could not read site-config.json, using default config:", err);
  }

  globalThis.__HIPHIM_SITE_CONFIG__ = DEFAULT_SITE_CONFIG;
  getSiteConfigAsync().catch(() => {});
  return DEFAULT_SITE_CONFIG;
}

/**
 * Reads the authoritative site configuration from Cloudflare D1 or Neon PostgreSQL,
 * ensuring Admin changes (Ads toggles, Featured slugs, Announcements) persist across all Worker isolates.
 */
export async function getSiteConfigAsync(forceRefresh = false): Promise<SiteConfig> {
  const now = Date.now();
  if (
    !forceRefresh &&
    globalThis.__HIPHIM_SITE_CONFIG__ &&
    globalThis.__HIPHIM_SITE_CONFIG_TS__ &&
    now - globalThis.__HIPHIM_SITE_CONFIG_TS__ < CONFIG_MEMORY_TTL
  ) {
    return globalThis.__HIPHIM_SITE_CONFIG__;
  }

  if (!forceRefresh && globalThis.__HIPHIM_SITE_CONFIG_PROMISE__) {
    return globalThis.__HIPHIM_SITE_CONFIG_PROMISE__;
  }

  const loadPromise = (async (): Promise<SiteConfig> => {
    // 1. Try Cloudflare D1
    try {
      const d1 = await getD1Database();
      if (d1) {
        const row = await d1
          .prepare("SELECT data FROM hiphim_site_config WHERE key = 'main' LIMIT 1")
          .first<{ data: string }>();
        if (row?.data) {
          const parsed = typeof row.data === "string" ? JSON.parse(row.data) : row.data;
          const merged = mergeWithDefaults(parsed);
          globalThis.__HIPHIM_SITE_CONFIG__ = merged;
          globalThis.__HIPHIM_SITE_CONFIG_TS__ = Date.now();
          return merged;
        }
      }
    } catch {}

    // 2. Try Neon PostgreSQL
    if (vercelSql) {
      try {
        const rows = await vercelSql`
          SELECT data FROM hiphim_site_config WHERE key = 'main' LIMIT 1
        `;
        if (rows && rows.length > 0 && rows[0]?.data) {
          const raw = rows[0].data;
          const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
          const merged = mergeWithDefaults(parsed);
          globalThis.__HIPHIM_SITE_CONFIG__ = merged;
          globalThis.__HIPHIM_SITE_CONFIG_TS__ = Date.now();
          return merged;
        }
      } catch {}
    }

    // 3. Fallback to file/memory
    const fallback = globalThis.__HIPHIM_SITE_CONFIG__ || DEFAULT_SITE_CONFIG;
    globalThis.__HIPHIM_SITE_CONFIG_TS__ = Date.now();
    return fallback;
  })();

  globalThis.__HIPHIM_SITE_CONFIG_PROMISE__ = loadPromise;
  try {
    return await loadPromise;
  } finally {
    globalThis.__HIPHIM_SITE_CONFIG_PROMISE__ = undefined;
  }
}

/**
 * Updates the site configuration and persists it to D1, PostgreSQL, and file.
 */
export async function saveSiteConfigAsync(newConfig: Partial<SiteConfig>): Promise<SiteConfig> {
  const current = await getSiteConfigAsync(true).catch(() => getSiteConfig());
  const updated: SiteConfig = {
    ...current,
    ...newConfig,
    announcement: {
      ...current.announcement,
      ...(newConfig.announcement || {}),
    },
    maintenance: {
      ...current.maintenance,
      ...(newConfig.maintenance || {}),
    },
    player: {
      ...current.player,
      ...(newConfig.player || {}),
    },
    ads: {
      ...DEFAULT_SITE_CONFIG.ads,
      ...(current.ads || {}),
      ...(newConfig.ads || {}),
    },
  };

  globalThis.__HIPHIM_SITE_CONFIG__ = updated;
  globalThis.__HIPHIM_SITE_CONFIG_TS__ = Date.now();

  const dbWrites: Promise<any>[] = [];

  dbWrites.push(
    getD1Database()
      .then((d1) => {
        if (d1) {
          return d1
            .prepare("INSERT OR REPLACE INTO hiphim_site_config (key, data, updated_at) VALUES ('main', ?, ?)")
            .bind(JSON.stringify(updated), Date.now())
            .run();
        }
      })
      .catch((err) => console.warn("[D1] Could not persist site config to D1:", err))
  );

  if (vercelSql) {
    dbWrites.push(
      vercelSql`
        INSERT INTO hiphim_site_config (key, data)
        VALUES ('main', ${JSON.stringify(updated)}::jsonb)
        ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data
      `.catch((dbErr: any) => console.warn("[DB] Could not persist site config to PostgreSQL:", dbErr))
    );
  }

  await Promise.allSettled(dbWrites);

  try {
    const dir = path.dirname(CONFIG_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(updated, null, 2), "utf-8");
  } catch {}

  return updated;
}

export function saveSiteConfig(newConfig: Partial<SiteConfig>): SiteConfig {
  const current = getSiteConfig();
  const updated: SiteConfig = {
    ...current,
    ...newConfig,
    announcement: {
      ...current.announcement,
      ...(newConfig.announcement || {}),
    },
    maintenance: {
      ...current.maintenance,
      ...(newConfig.maintenance || {}),
    },
    player: {
      ...current.player,
      ...(newConfig.player || {}),
    },
    ads: {
      ...DEFAULT_SITE_CONFIG.ads,
      ...(current.ads || {}),
      ...(newConfig.ads || {}),
    },
  };

  globalThis.__HIPHIM_SITE_CONFIG__ = updated;
  globalThis.__HIPHIM_SITE_CONFIG_TS__ = Date.now();
  saveSiteConfigAsync(newConfig).catch(() => {});
  return updated;
}
