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

/** New updates cached 60 seconds for instant fresh movies - Multi-page deep fetch */
export const getCachedNewUpdates = unstable_cache(
  async () => {
    try {
      const [movies] = await api.newAddingMultiPage(2, 24);
      return (movies as any[]) ?? [];
    } catch {
      return [];
    }
  },
  ["new-updates-v5"],
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

export type RankingPeriod = "day" | "week" | "month" | "views" | "rating";

export interface RankingMovieItem {
  _id: string;
  name: string;
  slug: string;
  origin_name?: string;
  thumb_url?: string;
  poster_url?: string;
  year?: number;
  quality?: string;
  time?: string;
  episode_current?: string;
  lang?: string;
  category?: Array<{ id?: string; name: string; slug: string }>;
  country?: Array<{ id?: string; name: string; slug: string }>;
  tmdb?: {
    id?: string;
    type?: string;
    vote_average?: number;
    vote_count?: number;
  };
  imdb?: {
    id?: string;
    vote_average?: number;
    vote_count?: number;
  };
  view?: number;
  type?: string;
}

export interface AllRankingsData {
  day: RankingMovieItem[];
  week: RankingMovieItem[];
  month: RankingMovieItem[];
  views: RankingMovieItem[];
  rating: RankingMovieItem[];
}

/** All 5 Rankings cached for 15 minutes */
export const getCachedAllRankings = unstable_cache(
  async (): Promise<AllRankingsData> => {
    try {
      const [
        [newItems],
        [boViews],
        [leViews],
        [chieuRap],
        featured,
      ] = await Promise.all([
        api.newAdding(1).catch(() => [[], null]),
        api.getFilteredList({ typeList: "phim-bo", sortField: "view", sortType: "desc", limit: 20 }).catch(() => [[], null]),
        api.getFilteredList({ typeList: "phim-le", sortField: "view", sortType: "desc", limit: 20 }).catch(() => [[], null]),
        api.getFilteredList({ typeList: "phim-chieu-rap", sortField: "modified.time", sortType: "desc", limit: 16 }).catch(() => [[], null]),
        getCachedFeaturedMovies().catch(() => []),
      ]);

      const safeNew = newItems || [];
      const safeBo = boViews || [];
      const safeLe = leViews || [];
      const safeRap = chieuRap || [];
      const safeFeat = featured || [];

      const dedupe = (items: any[]): RankingMovieItem[] => {
        const seen = new Set<string>();
        const res: RankingMovieItem[] = [];
        for (const item of items) {
          if (item?.slug && !seen.has(item.slug)) {
            seen.add(item.slug);
            res.push(item);
          }
        }
        return res;
      };

      // 1. Top Lượt Xem
      const viewsList = dedupe([...safeBo, ...safeLe, ...safeRap]);

      // 2. Top Đánh Giá: sorted by tmdb.vote_average desc
      const allForRating = dedupe([...viewsList, ...safeNew, ...safeFeat]);
      const ratingList = [...allForRating]
        .filter((m) => (m.tmdb?.vote_average || 0) >= 6.5 || (m.imdb?.vote_average || 0) >= 6.5)
        .sort((a, b) => {
          const scoreB = b.tmdb?.vote_average || b.imdb?.vote_average || 0;
          const scoreA = a.tmdb?.vote_average || a.imdb?.vote_average || 0;
          return scoreB - scoreA;
        });

      // 3. Top Phim Ngày: featured blockbusters + today's latest updates
      const dayList = dedupe([...safeFeat, ...safeNew, ...safeRap]);

      // 4. Top Phim Tuần: top series & movies with strong activity
      const weekList = dedupe([...safeRap, ...safeBo.slice(0, 10), ...safeLe.slice(0, 10), ...safeFeat]);

      // 5. Top Phim Tháng: popular cinema & major series
      const monthList = dedupe([...safeBo, ...safeRap, ...safeLe]);

      return {
        day: dayList.slice(0, 20),
        week: weekList.slice(0, 20),
        month: monthList.slice(0, 20),
        views: viewsList.slice(0, 20),
        rating: ratingList.slice(0, 20),
      };
    } catch (err) {
      console.error("Failed to fetch rankings:", err);
      return { day: [], week: [], month: [], views: [], rating: [] };
    }
  },
  ["all-rankings-v1"],
  { revalidate: 900, tags: ["rankings"] }
);

/** Filtered/Topic movies cached for 15 minutes - instant SSR */
export const getCachedFilteredMovies = async (params: {
  typeList?: string;
  category?: string;
  topic?: string;
  country?: string;
  year?: string | number;
  page?: number;
  sortField?: string;
  sortType?: string;
  sortLang?: string;
  limit?: number;
}) => {
  const {
    typeList,
    category,
    topic,
    country,
    year,
    page = 1,
    sortField = "modified.time",
    sortType = "desc",
    sortLang = "vietsub",
    limit = 20,
  } = params;

  const cacheKey = `filter_${typeList || ""}_${category || ""}_${topic || ""}_${country || ""}_${year || ""}_p${page}_sf${sortField}_st${sortType}_l${limit}`;

  return unstable_cache(
    async () => {
      try {
        if (typeList) {
          const [items, pagination] = await api.getFilteredList({
            typeList,
            page,
            sortField,
            sortType,
            sortLang,
            category,
            country,
            year,
            limit,
          });
          return { items: items || [], pagination: pagination || null };
        }
        if (category) {
          const [items, pagination] = await api.byCategory(category, page);
          return { items: items || [], pagination: pagination || null };
        }
        if (country) {
          const [items, pagination] = await api.byCountry(country, page);
          return { items: items || [], pagination: pagination || null };
        }
        if (year) {
          const [items, pagination] = await api.byYear(year, page);
          return { items: items || [], pagination: pagination || null };
        }
        if (topic) {
          const [items, pagination] = await api.byTopic(topic, page);
          return { items: items || [], pagination: pagination || null };
        }
        const [items, pagination] = await api.newAdding(page);
        return { items: items || [], pagination: pagination || null };
      } catch (err) {
        console.warn("Failed to fetch filtered movies in getCachedFilteredMovies:", err);
        return { items: [], pagination: null };
      }
    },
    [cacheKey],
    { revalidate: 600, tags: ["filtered-movies"] }
  )();
};

