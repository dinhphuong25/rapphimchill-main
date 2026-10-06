import fs from "fs";
import path from "path";

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
  customFooterText: "Hi Phim — Nền tảng xem phim miễn phí phi lợi nhuận.",
};

declare global {
  // eslint-disable-next-line no-var
  var __HIPHIM_SITE_CONFIG__: SiteConfig | undefined;
}

const CONFIG_FILE_PATH = path.join(process.cwd(), "data", "site-config.json");

/**
 * Reads the site configuration from file or memory.
 */
export function getSiteConfig(): SiteConfig {
  if (globalThis.__HIPHIM_SITE_CONFIG__) {
    return globalThis.__HIPHIM_SITE_CONFIG__;
  }

  try {
    if (fs.existsSync(CONFIG_FILE_PATH)) {
      const fileData = fs.readFileSync(CONFIG_FILE_PATH, "utf-8");
      const parsed = JSON.parse(fileData);
      const merged: SiteConfig = {
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
      };
      globalThis.__HIPHIM_SITE_CONFIG__ = merged;
      return merged;
    }
  } catch (err) {
    console.warn("Could not read site-config.json, using default config:", err);
  }

  globalThis.__HIPHIM_SITE_CONFIG__ = DEFAULT_SITE_CONFIG;
  return DEFAULT_SITE_CONFIG;
}

/**
 * Updates the site configuration and persists it to file.
 */
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
  };

  globalThis.__HIPHIM_SITE_CONFIG__ = updated;

  try {
    const dir = path.dirname(CONFIG_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(updated, null, 2), "utf-8");
  } catch (err) {
    console.error("Could not write site-config.json:", err);
  }

  return updated;
}
