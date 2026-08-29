"use client";
import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import LiveStatus from "@/components/live-status";
import { filterHiddenMovies } from "@/lib/hidden-movies";
import { MovieGridSkeleton } from "@/components/movie/movie-skeleton";
import dynamic from "next/dynamic";
import { apiCache } from "@/lib/api-cache";

const InfiniteMovieGrid = dynamic(
  () => import("@/components/movie/infinite-movie-grid"),
  { ssr: false, loading: () => <MovieGridSkeleton count={10} /> }
);

interface MovieListClientProps {
  index?: number;
  category?: string;
  topic?: string;
}

// Topic name mapping
const TOPIC_NAMES: Record<string, string> = {
  "phim-bo": "Chương Trình Truyền Hình",
  "phim-le": "Phim Điện Ảnh",
  "hoat-hinh": "Phim Hoạt Hình",
  "tv-shows": "TV Shows",
  "phim-vietsub": "Phim Vietsub",
  "phim-thuyet-minh": "Phim Thuyết Minh",
  "phim-long-tieng": "Phim Lồng Tiếng",
  "phim-chieu-rap": "Phim Chiếu Rạp",
};

const MovieListClient = ({
  index = 1,
  category,
  topic,
}: MovieListClientProps) => {
  const searchParams = useSearchParams();
  const [movies, setMovies] = useState<any[]>([]);
  const [pageInfo, setPageInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const proxyFetch = (url: string) =>
    apiCache.fetchWithCache(url, () =>
      fetch(`/api/phim?url=${encodeURIComponent(url)}`).then((r) => r.json())
    , 60000);

  const fetchMovies = async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      // Lấy tất cả filter params
      const filterCountry = searchParams.get("country");
      const filterCategory = searchParams.get("category");
      const filterYear = searchParams.get("year");
      const typeList = searchParams.get("typeList");
      const sortField = searchParams.get("sortField");
      const sortType = searchParams.get("sortType") || "desc";
      const sortLang = searchParams.get("sortLang") || "vietsub";
      const limit = searchParams.get("limit") || "20";

      let url: string;
      let usesV1Api = true;

      const cat = filterCategory || category;

      if (typeList) {
        const baseType = typeList;
        const urlObj = new URL(`https://phimapi.com/v1/api/danh-sach/${baseType}`);
        urlObj.searchParams.set("page", String(index));
        urlObj.searchParams.set("sort_field", sortField || "modified.time");
        urlObj.searchParams.set("sort_type", sortType);
        urlObj.searchParams.set("limit", limit);
        if (sortLang) urlObj.searchParams.set("sort_lang", sortLang);
        if (cat) urlObj.searchParams.set("category", cat);
        if (filterCountry) urlObj.searchParams.set("country", filterCountry);
        if (filterYear) urlObj.searchParams.set("year", filterYear);
        url = urlObj.toString();
      } else if (cat) {
        url = `https://phimapi.com/v1/api/the-loai/${cat}?page=${index}&limit=${limit}`;
      } else if (filterCountry) {
        url = `https://phimapi.com/v1/api/quoc-gia/${filterCountry}?page=${index}&limit=${limit}`;
      } else if (topic) {
        url = `https://phimapi.com/v1/api/danh-sach/${topic}?page=${index}&limit=${limit}`;
      } else {
        url = `https://phimapi.com/danh-sach/phim-moi-cap-nhat?page=${index}`;
        usesV1Api = false;
      }

      const data = await proxyFetch(url);


      // Robust data parsing: handle data.data.items (v1) and data.items (v2/legacy)
      const items = data?.data?.items || data?.items || [];
      const pagination = data?.data?.params?.pagination || data?.pagination || null;

      setMovies(filterHiddenMovies(items));
      setPageInfo(pagination);

      setLastUpdated(new Date());
    } catch (error) {
      console.error("Failed to fetch movies:", error);
      setMovies([]);
      setPageInfo(null);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMovies();

    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchMovies(true);
      }
    }, 180000);

    return () => clearInterval(interval);
  }, [index, category, topic, searchParams]);

  const handleRefresh = () => {
    fetchMovies(true);
  };

  const getPageTitle = () => {
    const typeList = searchParams.get("typeList");
    if (typeList) return TOPIC_NAMES[typeList] || "Kết quả lọc";
    if (topic) return TOPIC_NAMES[topic] || topic;
    if (category) return category;
    return "Danh sách phim";
  };

  if (loading) {
    return (
      <div className="pt-4 sm:pt-8 px-1 sm:px-0 space-y-6">
        <div className="h-8 w-48 bg-zinc-800 animate-pulse rounded" />
        <MovieGridSkeleton count={10} />
      </div>
    );
  }

  if (movies.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center pt-8">
        <div className="text-center space-y-4 max-w-md">
          <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-10 h-10 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-white">Không tìm thấy phim</h3>
          <p className="text-gray-400">Vui lòng thử lại với các tùy chọn khác.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-4 sm:pt-8 px-1 sm:px-0">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-8 px-1">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-1 h-6 sm:h-8 bg-primary rounded-full" />
          <h1 className="text-lg sm:text-2xl md:text-3xl font-bold text-white">
            {getPageTitle()}
          </h1>
        </div>
        <div className="hidden sm:block">
          <LiveStatus
            lastUpdated={lastUpdated}
            isRefreshing={isRefreshing}
            onRefresh={handleRefresh}
          />
        </div>
      </div>

      {/* Infinite scroll grid — replaces paginated grid */}
      <Suspense fallback={<MovieGridSkeleton count={10} />}>
        <InfiniteMovieGrid
          initialMovies={movies}
          topic={topic}
          category={category}
        />
      </Suspense>
    </div>
  );
};

export default React.memo(MovieListClient);

