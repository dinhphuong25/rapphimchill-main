"use client";

import { memo, useMemo } from "react";
import { useNewUpdates, useTopicsWithMovies } from "@/hooks/useApiHooks";
import HeroSection from "@/components/hero-section";
import MovieSection from "@/components/movie-section";
import LiveStatus from "@/components/live-status";
import { filterHiddenMovies } from "@/lib/hidden-movies";
import dynamic from "next/dynamic";

const ContinueWatching = dynamic(() => import("@/components/movie/continue-watching"), {
  ssr: false,
  loading: () => null,
});

interface HomeClientProps {
  initialMovies: any[];
  initialTopicsWithMovies: any[];
  topics: any[];
  categories?: any[];
  featuredMovie?: any;
  featuredMovies?: any[];
}

export default function HomeClient({
  initialMovies,
  initialTopicsWithMovies,
  topics,
  featuredMovie,
  featuredMovies = [],
}: HomeClientProps) {
  const {
    movies: clientMovies,
    heroMovie,
    lastUpdated,
    isRefreshing,
    refresh: refreshMovies,
  } = useNewUpdates();

  const { topicsData } = useTopicsWithMovies(topics);

  const displayMovies = useMemo(() => {
    const raw = clientMovies && clientMovies.length > 0 ? clientMovies : (initialMovies || []);
    return filterHiddenMovies(raw);
  }, [clientMovies, initialMovies]);

  const heroMoviesList = useMemo(() => {
    const list = [
      ...(Array.isArray(featuredMovies) && featuredMovies.length > 0 ? featuredMovies : []),
      featuredMovie,
      heroMovie,
      ...(displayMovies || []),
    ].filter(Boolean);
    const seen = new Set<string>();
    return list.filter((m: any) => {
      if (!m?.slug || seen.has(m.slug)) return false;
      seen.add(m.slug);
      return true;
    });
  }, [featuredMovies, featuredMovie, heroMovie, displayMovies]);

  const displayTopicsMap = useMemo(() => {
    const map: Record<string, any[]> = {};
    initialTopicsWithMovies.forEach((item) => {
      const clientTopic = topicsData.find((t: any) => t.slug === item.slug);
      map[item.slug] = (clientTopic?.movies && clientTopic.movies.length > 0)
        ? clientTopic.movies
        : item.movies || [];
    });
    return map;
  }, [initialTopicsWithMovies, topicsData]);

  return (
    <div className="space-y-10 pb-16">
      {/* Hero Section (Asymmetric Editorial Layout) */}
      {heroMoviesList.length > 0 && (
        <HeroSection movies={heroMoviesList} />
      )}

      {/* Main Content Area */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 space-y-12">
        {/* Continue Watching Section */}
        <ContinueWatching />

        {/* Section 01: Phim Mới Cập Nhật */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <LiveStatus lastUpdated={lastUpdated} isRefreshing={isRefreshing} onRefresh={refreshMovies} />
          </div>
          <MovieSection
            indexNumber="01"
            title="Phim Mới Cập Nhật"
            movies={displayMovies}
            viewAllLink="/new-updates"
            variant="carousel"
          />
        </div>

        {/* Section 02: Top 10 Thịnh Hành */}
        <MovieSection
          indexNumber="02"
          title="Top 10 Phim Thịnh Hành"
          movies={displayMovies}
          viewAllLink="/?typeList=phim-bo"
          variant="top10"
        />

        {/* Section 03: Tiêu Điểm Phim Bộ (1 Large + 4 Small Grid) */}
        {displayTopicsMap["phim-bo"] && displayTopicsMap["phim-bo"].length > 0 && (
          <MovieSection
            indexNumber="03"
            title="Phim Bộ Tiêu Điểm"
            movies={displayTopicsMap["phim-bo"]}
            viewAllLink="/?typeList=phim-bo"
            variant="featured"
          />
        )}

        {/* Section 04: Phim Lẻ Điện Ảnh */}
        {displayTopicsMap["phim-le"] && displayTopicsMap["phim-le"].length > 0 && (
          <MovieSection
            indexNumber="04"
            title="Phim Lẻ Điện Ảnh"
            movies={displayTopicsMap["phim-le"]}
            viewAllLink="/?typeList=phim-le"
            variant="grid"
          />
        )}

        {/* Section 05: Phim Hoạt Hình & Anime */}
        {displayTopicsMap["hoat-hinh"] && displayTopicsMap["hoat-hinh"].length > 0 && (
          <MovieSection
            indexNumber="05"
            title="Hoạt Hình & Anime"
            movies={displayTopicsMap["hoat-hinh"]}
            viewAllLink="/?typeList=hoat-hinh"
            variant="carousel"
          />
        )}
      </div>
    </div>
  );
}
