import AsyncStorage from "@react-native-async-storage/async-storage";
import { MovieItem } from "./api";

const LEGACY_HISTORY_KEY = "@hiphim_watch_history_v1";
const LEGACY_FAVORITES_KEY = "@hiphim_favorites_v1";
const USER_PROFILE_KEY = "@hiphim_user_profile";

export interface HistoryItem extends MovieItem {
  lastWatchedAt: number;
  lastEpisodeName?: string;
  lastEpisodeSlug?: string;
  progressSeconds?: number;
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
 * One-time migration: migrate legacy unauthenticated storage to the first logged-in user
 */
async function migrateLegacyDataIfNeeded(userId: string): Promise<void> {
  if (migratedUsers.has(userId)) return;
  migratedUsers.add(userId);

  try {
    const userFavKey = getFavoritesKey(userId);
    const existingFav = await AsyncStorage.getItem(userFavKey);
    if (!existingFav) {
      const legacyFav = await AsyncStorage.getItem(LEGACY_FAVORITES_KEY);
      if (legacyFav) {
        await AsyncStorage.setItem(userFavKey, legacyFav);
        await AsyncStorage.removeItem(LEGACY_FAVORITES_KEY);
      }
    }

    const userHistKey = getHistoryKey(userId);
    const existingHist = await AsyncStorage.getItem(userHistKey);
    if (!existingHist) {
      const legacyHist = await AsyncStorage.getItem(LEGACY_HISTORY_KEY);
      if (legacyHist) {
        await AsyncStorage.setItem(userHistKey, legacyHist);
        await AsyncStorage.removeItem(LEGACY_HISTORY_KEY);
      }
    }
  } catch (err) {
    console.warn("Legacy data migration warning:", err);
  }
}

/**
 * Get watch history for the current logged-in user.
 * Returns empty array if not logged in.
 */
export async function getWatchHistory(): Promise<HistoryItem[]> {
  const userId = await resolveUserId();
  if (!userId) {
    return [];
  }

  await migrateLegacyDataIfNeeded(userId);

  try {
    const raw = await AsyncStorage.getItem(getHistoryKey(userId));
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error("getWatchHistory error:", err);
    return [];
  }
}

/**
 * Save movie into watch history for the current logged-in user.
 * No-ops if not logged in.
 */
export async function saveWatchHistory(
  item: MovieItem,
  episodeName?: string,
  episodeSlug?: string,
  progressSeconds?: number
): Promise<void> {
  const userId = await resolveUserId();
  if (!userId) {
    // Only logged in users record history
    return;
  }

  await migrateLegacyDataIfNeeded(userId);

  try {
    const history = await getWatchHistory();
    const filtered = history.filter((h) => h.slug !== item.slug);
    const newEntry: HistoryItem = {
      ...item,
      lastWatchedAt: Date.now(),
      lastEpisodeName: episodeName,
      lastEpisodeSlug: episodeSlug,
      progressSeconds,
    };
    // Keep max 50 recent items
    const updated = [newEntry, ...filtered].slice(0, 50);
    await AsyncStorage.setItem(getHistoryKey(userId), JSON.stringify(updated));
  } catch (err) {
    console.error("saveWatchHistory error:", err);
  }
}

/**
 * Remove a movie from watch history of the current user.
 */
export async function removeWatchHistory(slug: string): Promise<void> {
  const userId = await resolveUserId();
  if (!userId) return;

  try {
    const history = await getWatchHistory();
    const updated = history.filter((h) => h.slug !== slug);
    await AsyncStorage.setItem(getHistoryKey(userId), JSON.stringify(updated));
  } catch (err) {
    console.error("removeWatchHistory error:", err);
  }
}

/**
 * Clear all watch history for the current user.
 */
export async function clearWatchHistory(): Promise<void> {
  const userId = await resolveUserId();
  if (!userId) return;

  try {
    await AsyncStorage.removeItem(getHistoryKey(userId));
  } catch (err) {
    console.error("clearWatchHistory error:", err);
  }
}

/**
 * Get favorites list for the current logged-in user.
 * Returns empty array if not logged in.
 */
export async function getFavorites(): Promise<MovieItem[]> {
  const userId = await resolveUserId();
  if (!userId) {
    return [];
  }

  await migrateLegacyDataIfNeeded(userId);

  try {
    const raw = await AsyncStorage.getItem(getFavoritesKey(userId));
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error("getFavorites error:", err);
    return [];
  }
}

/**
 * Check if a movie is favorite for the current logged-in user.
 */
export async function isFavorite(slug: string): Promise<boolean> {
  const userId = await resolveUserId();
  if (!userId) return false;

  try {
    const favorites = await getFavorites();
    return favorites.some((f) => f.slug === slug);
  } catch {
    return false;
  }
}

/**
 * Toggle favorite for the current logged-in user.
 * Returns false if not logged in.
 */
export async function toggleFavorite(movie: MovieItem): Promise<boolean> {
  const userId = await resolveUserId();
  if (!userId) {
    return false;
  }

  await migrateLegacyDataIfNeeded(userId);

  try {
    const favorites = await getFavorites();
    const exists = favorites.some((f) => f.slug === movie.slug);
    let updated: MovieItem[];
    if (exists) {
      updated = favorites.filter((f) => f.slug !== movie.slug);
    } else {
      updated = [movie, ...favorites];
    }
    await AsyncStorage.setItem(getFavoritesKey(userId), JSON.stringify(updated));
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
