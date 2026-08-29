import { unstable_cache } from "next/cache";
import PhimApi from "@/libs/phimapi.com";

const FEATURED_SLUG = "avatar-lua-va-tro-tan";

const api = new PhimApi();

/** Categories cached 24h — gọi từ metadata & page component đều dùng chung 1 cache entry */
export const getCachedCategories = unstable_cache(
  () => api.listCategories(),
  ["categories"],
  { revalidate: 86400, tags: ["categories"] }
);

/** Countries cached 24h */
export const getCachedCountries = unstable_cache(
  () => api.listCountries(),
  ["countries"],
  { revalidate: 86400, tags: ["countries"] }
);

/** Featured movie cached 1h */
export const getCachedFeaturedMovie = unstable_cache(
  async () => {
    try {
      const data = await api.get(FEATURED_SLUG);
      return data.movie ?? null;
    } catch {
      return null;
    }
  },
  ["featured-movie", FEATURED_SLUG],
  { revalidate: 3600, tags: ["featured-movie"] }
);

/** New updates cached 5 minutes */
export const getCachedNewUpdates = unstable_cache(
  async () => {
    try {
      const [movies] = await api.newAdding(1);
      return (movies as any[]) ?? [];
    } catch {
      return [];
    }
  },
  ["new-updates"],
  { revalidate: 300, tags: ["new-updates"] }
);

/** Topic movies cached 1h */
export const getCachedTopicMovies = unstable_cache(
  async (slug: string, limit: number = 12) => {
    try {
      return await api.getTopicItems(slug, limit);
    } catch {
      return [];
    }
  },
  ["topic-movies"],
  { revalidate: 3600, tags: ["topic-movies"] }
);
