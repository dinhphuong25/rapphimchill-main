import AsyncStorage from "@react-native-async-storage/async-storage";
import { MovieItem } from "./api";

const LEGACY_HISTORY_KEY = "@hiphim_watch_history_v1";
const LEGACY_FAVORITES_KEY = "@hiphim_favorites_v1";
const GUEST_HISTORY_KEY = "@hiphim_guest_history";
const GUEST_FAVORITES_KEY = "@hiphim_guest_favorites";
const USER_PROFILE_KEY = "@hiphim_user_profile";

export interface HistoryItem extends MovieItem {
  lastWatchedAt: number;
  lastEpisodeName?: string;
  lastEpisodeSlug?: string;
  progressSeconds?: number;
  duration?: number;
}

let activeUserId: string | null = null;
let migratedUsers = new Set<string>();

/**
 * Configure the currently active user ID for scoped storage.
 * Call this upon login, session restore, or logout.
 */
export function setActiveUserId(userId: string | null) {
  activeUserId = userId ? String(userId) : null;
}

export function getActiveUserId(): string | null {
  return activeUserId;
}

/**
 * Resolve effective user ID: uses in-memory activeUserId or checks stored user profile.
 */
async function resolveUserId(): Promise<string | null> {
  if (activeUserId) return activeUserId;
  try {
    const raw = await AsyncStorage.getItem(USER_PROFILE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.id) {
        activeUserId = String(parsed.id);
        return activeUserId;
      }
    }
  } catch {}
  return null;
}

function getHistoryKey(userId: string): string {
  return `@hiphim_history_user_${userId}`;
}

function getFavoritesKey(userId: string): string {
  return `@hiphim_favorites_user_${userId}`;
}

/**
 * One-time migration: migrate legacy or guest data to the logged-in user
 */
async function migrateLegacyDataIfNeeded(userId: string): Promise<void> {
  if (migratedUsers.has(userId)) return;
  migratedUsers.add(userId);

  try {
    // 1. Favorites merge
    const userFavKey = getFavoritesKey(userId);
    const existingFavRaw = await AsyncStorage.getItem(userFavKey);
    let userFavs: MovieItem[] = existingFavRaw ? JSON.parse(existingFavRaw) : [];

    // Check guest favorites
    const guestFavRaw = await AsyncStorage.getItem(GUEST_FAVORITES_KEY);
    const guestFavs: MovieItem[] = guestFavRaw ? JSON.parse(guestFavRaw) : [];

    // Check legacy favorites
    const legacyFavRaw = await AsyncStorage.getItem(LEGACY_FAVORITES_KEY);
    const legacyFavs: MovieItem[] = legacyFavRaw ? JSON.parse(legacyFavRaw) : [];

    const allFavs = [...userFavs, ...guestFavs, ...legacyFavs];
    const favSlugMap = new Map<string, MovieItem>();
    for (const item of allFavs) {
      if (item?.slug && !favSlugMap.has(item.slug)) {
        favSlugMap.set(item.slug, item);
      }
    }
    const mergedFavs = Array.from(favSlugMap.values());
    await AsyncStorage.setItem(userFavKey, JSON.stringify(mergedFavs));
    await AsyncStorage.removeItem(LEGACY_FAVORITES_KEY);

    // 2. History merge
    const userHistKey = getHistoryKey(userId);
    const existingHistRaw = await AsyncStorage.getItem(userHistKey);
    let userHist: HistoryItem[] = existingHistRaw ? JSON.parse(existingHistRaw) : [];

    // Check guest history
    const guestHistRaw = await AsyncStorage.getItem(GUEST_HISTORY_KEY);
    const guestHist: HistoryItem[] = guestHistRaw ? JSON.parse(guestHistRaw) : [];

    // Check legacy history
    const legacyHistRaw = await AsyncStorage.getItem(LEGACY_HISTORY_KEY);
    const legacyHist: HistoryItem[] = legacyHistRaw ? JSON.parse(legacyHistRaw) : [];

    const allHist = [...userHist, ...guestHist, ...legacyHist];
    const histSlugMap = new Map<string, HistoryItem>();
    allHist.sort((a, b) => (b.lastWatchedAt || 0) - (a.lastWatchedAt || 0));
    for (const item of allHist) {
      if (item?.slug && !histSlugMap.has(item.slug)) {
        histSlugMap.set(item.slug, item);
      }
    }
    const mergedHist = Array.from(histSlugMap.values()).slice(0, 50);
    await AsyncStorage.setItem(userHistKey, JSON.stringify(mergedHist));
    await AsyncStorage.removeItem(LEGACY_HISTORY_KEY);
  } catch (err) {
    console.warn("Legacy/Guest data migration warning:", err);
  }
}

/**
 * Get watch history: returns current user history if logged in, or local guest history if guest.
 */
export async function getWatchHistory(): Promise<HistoryItem[]> {
  const userId = await resolveUserId();

  if (userId) {
    await migrateLegacyDataIfNeeded(userId);
    try {
      const raw = await AsyncStorage.getItem(getHistoryKey(userId));
      return raw ? JSON.parse(raw) : [];
    } catch (err) {
      console.error("getWatchHistory error:", err);
      return [];
    }
  }

  // Guest fallback
  try {
    const raw = await AsyncStorage.getItem(GUEST_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error("getGuestWatchHistory error:", err);
    return [];
  }
}

/**
 * Retrieve watch progress of a specific movie by slug.
 */
export async function getMovieWatchProgress(slug: string): Promise<HistoryItem | null> {
  try {
    const history = await getWatchHistory();
    return history.find((h) => h.slug === slug) || null;
  } catch {
    return null;
  }
}

/**
 * Save movie into watch history for the current session (guest or logged-in).
 * Always auto-saves like the Web experience.
 */
export async function saveWatchHistory(
  item: MovieItem,
  episodeName?: string,
  episodeSlug?: string,
  progressSeconds?: number,
  duration?: number
): Promise<void> {
  const userId = await resolveUserId();

  try {
    const history = await getWatchHistory();
    const existing = history.find((h) => h.slug === item.slug);

    const newEntry: HistoryItem = {
      ...item,
      lastWatchedAt: Date.now(),
      lastEpisodeName: episodeName || existing?.lastEpisodeName,
      lastEpisodeSlug: episodeSlug || existing?.lastEpisodeSlug,
      progressSeconds:
        typeof progressSeconds === "number" && progressSeconds >= 0
          ? Math.floor(progressSeconds)
          : existing?.progressSeconds || 0,
      duration:
        typeof duration === "number" && duration > 0
          ? Math.floor(duration)
          : existing?.duration || 0,
    };

    const filtered = history.filter((h) => h.slug !== item.slug);
    const updated = [newEntry, ...filtered].slice(0, 50);

    if (userId) {
      await AsyncStorage.setItem(getHistoryKey(userId), JSON.stringify(updated));
    }
    // Always persist to local guest storage as instant cache
    await AsyncStorage.setItem(GUEST_HISTORY_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error("saveWatchHistory error:", err);
  }
}

/**
 * Remove a movie from watch history.
 */
export async function removeWatchHistory(slug: string): Promise<void> {
  const userId = await resolveUserId();

  try {
    const history = await getWatchHistory();
    const updated = history.filter((h) => h.slug !== slug);

    if (userId) {
      await AsyncStorage.setItem(getHistoryKey(userId), JSON.stringify(updated));
    }
    await AsyncStorage.setItem(GUEST_HISTORY_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error("removeWatchHistory error:", err);
  }
}

/**
 * Clear all watch history.
 */
export async function clearWatchHistory(): Promise<void> {
  const userId = await resolveUserId();

  try {
    if (userId) {
      await AsyncStorage.removeItem(getHistoryKey(userId));
    }
    await AsyncStorage.removeItem(GUEST_HISTORY_KEY);
  } catch (err) {
    console.error("clearWatchHistory error:", err);
  }
}

/**
 * Get favorites list (supports both guest and authenticated users).
 */
export async function getFavorites(): Promise<MovieItem[]> {
  const userId = await resolveUserId();

  if (userId) {
    await migrateLegacyDataIfNeeded(userId);
    try {
      const raw = await AsyncStorage.getItem(getFavoritesKey(userId));
      return raw ? JSON.parse(raw) : [];
    } catch (err) {
      console.error("getFavorites error:", err);
      return [];
    }
  }

  try {
    const raw = await AsyncStorage.getItem(GUEST_FAVORITES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error("getGuestFavorites error:", err);
    return [];
  }
}

/**
 * Check if a movie is favorite.
 */
export async function isFavorite(slug: string): Promise<boolean> {
  try {
    const favorites = await getFavorites();
    return favorites.some((f) => f.slug === slug);
  } catch {
    return false;
  }
}

/**
 * Toggle favorite (works seamlessly for guests and logged-in users).
 */
export async function toggleFavorite(movie: MovieItem): Promise<boolean> {
  const userId = await resolveUserId();

  try {
    const favorites = await getFavorites();
    const exists = favorites.some((f) => f.slug === movie.slug);
    let updated: MovieItem[];
    if (exists) {
      updated = favorites.filter((f) => f.slug !== movie.slug);
    } else {
      updated = [movie, ...favorites];
    }

    if (userId) {
      await AsyncStorage.setItem(getFavoritesKey(userId), JSON.stringify(updated));
    }
    await AsyncStorage.setItem(GUEST_FAVORITES_KEY, JSON.stringify(updated));
    return !exists;
  } catch (err) {
    console.error("toggleFavorite error:", err);
    return false;
  }
}

/**
 * Override/sync favorites for a specific user ID.
 */
export async function setUserFavorites(userId: string, items: MovieItem[]): Promise<void> {
  try {
    await AsyncStorage.setItem(getFavoritesKey(userId), JSON.stringify(items));
  } catch (err) {
    console.error("setUserFavorites error:", err);
  }
}

/**
 * Override/sync history for a specific user ID.
 */
export async function setUserHistory(userId: string, items: HistoryItem[]): Promise<void> {
  try {
    await AsyncStorage.setItem(getHistoryKey(userId), JSON.stringify(items));
  } catch (err) {
    console.error("setUserHistory error:", err);
  }
}
