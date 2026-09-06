import { unstable_cache } from "next/cache";
import PhimApi from "@/libs/phimapi.com";
import { getSiteConfig } from "@/lib/site-config";

export const TRENDING_FEATURED_SLUGS = [
  "deadpool-va-wolverine",
  "godzilla-x-kong-de-che-moi",
  "quat-mo-trung-ma",
  "arcane-lien-minh-huyen-thoai-phan-2",
  "nu-hoang-nuoc-mat",
  "avatar-lua-va-tro-tan",
  "nguoi-nhen-khoi-dau-moi",
];

const api = new PhimApi();

/** Categories cached 24h */
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

/** Multiple Featured movies cached 1h with full detailed metadata */
export const getCachedFeaturedMovies = unstable_cache(
  async () => {
    try {
      let slugs = TRENDING_FEATURED_SLUGS;
      try {
        const config = getSiteConfig();
        if (config.featuredSlugs && config.featuredSlugs.length > 0) {
          slugs = config.featuredSlugs;
        }
      } catch (err) {
        console.warn("Could not load featuredSlugs from config:", err);
      }

      const results = await Promise.allSettled(
        slugs.map((slug) => api.get(slug))
      );
      const movies = results
        .filter((r): r is PromiseFulfilledResult<{ movie: any; server: any[] }> => r.status === "fulfilled" && Boolean(r.value?.movie))
        .map((r) => r.value.movie);
      return movies.length > 0 ? movies : [];
    } catch {
      return [];
    }
  },
  ["featured-movies-v4"],
  { revalidate: 3600, tags: ["featured-movies"] }
);

/** Single featured movie fallback */
export const getCachedFeaturedMovie = unstable_cache(
  async () => {
    const movies = await getCachedFeaturedMovies();
    return movies[0] || null;
  },
  ["featured-movie-v3"],
  { revalidate: 3600, tags: ["featured-movie"] }
);

/** New updates cached 60 seconds for instant fresh movies */
export const getCachedNewUpdates = unstable_cache(
  async () => {
    try {
      const [movies] = await api.newAdding(1);
      return (movies as any[]) ?? [];
    } catch {
      return [];
    }
  },
  ["new-updates-v4"],
  { revalidate: 60, tags: ["new-updates"] }
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
