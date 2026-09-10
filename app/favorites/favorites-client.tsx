"use client";

import { useCallback, useEffect } from "react";
import { useFavorites } from "@/hooks/useLocalStorage";
import { Trash2 } from "lucide-react";
import Link from "next/link";
import MovieCardEditorial from "@/components/movie/movie-card-editorial";
import type { FavoriteItem } from "@/lib/types";

interface FavoritesClientProps {
  categories?: any[];
  countries?: any[];
}

export default function FavoritesClient({ categories, countries }: FavoritesClientProps) {
  const { favorites, removeFavorite, clearFavorites, batchUpdateFavorites, hydrated } = useFavorites();
  const movies = favorites;

  // Auto-enrich any items in favorites that miss origin_name or rating
  useEffect(() => {
    if (!hydrated || !favorites || favorites.length === 0) return;

    const itemsToEnrich = favorites.filter(m => !m.origin_name || (!m.tmdb?.vote_average && !m.imdb?.rating));
    if (itemsToEnrich.length === 0) return;

    let isMounted = true;
    Promise.all(
      itemsToEnrich.map(async (item) => {
        try {
          const res = await fetch(`/api/phim?url=${encodeURIComponent(`https://phimapi.com/phim/${item.slug}`)}`);
          if (!res.ok) return null;
          const data = await res.json();
          const m = data?.movie;
          if (!m) return null;
          return {
            slug: item.slug,
            origin_name: m.origin_name || item.origin_name,
            year: typeof m.year === "string" ? parseInt(m.year, 10) : (m.year || item.year),
            quality: m.quality || item.quality,
            episode_current: m.episode_current || item.episode_current,
            poster_url: m.poster_url || item.poster_url,
            thumb_url: m.thumb_url || item.thumb_url,
            tmdb: m.tmdb?.vote_average ? { vote_average: m.tmdb.vote_average } : item.tmdb,
            imdb: (m.imdb?.vote_average || m.imdb?.rating) ? { rating: m.imdb.vote_average || m.imdb.rating } : item.imdb,
          };
        } catch {
          return null;
        }
      })
    ).then((results) => {
      if (!isMounted) return;
      const validPatches = results.filter(Boolean) as (Partial<FavoriteItem> & { slug: string })[];
      if (validPatches.length > 0) {
        batchUpdateFavorites(validPatches);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [hydrated, favorites, batchUpdateFavorites]);

  const handleRemove = useCallback((slug: string) => {
    removeFavorite(slug);
  }, [removeFavorite]);

  const handleClearAll = () => {
    clearFavorites();
  };

  if (!hydrated) {
    return null;
  }

  return (
    <>
      <div className="w-full max-w-[1600px] mx-auto px-3.5 sm:px-8 lg:px-12 xl:px-16 pt-5 sm:pt-8 lg:pt-20 pb-20">
        <h1 className="sr-only">Phim Yêu Thích</h1>

        {/* Clear Action */}
        {movies.length > 0 && (
          <div className="flex justify-end mb-3 sm:mb-4">
            <button
              onClick={handleClearAll}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-white/50 hover:text-red-400 border border-white/10 hover:border-red-400/30 rounded-xl transition-colors hover:bg-red-400/10 font-bold cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xóa yêu thích</span>
            </button>
          </div>
        )}

        {/* Empty State: Tinh tế, tối giản, không dùng khung hộp thô */}
        {movies.length === 0 ? (
          <div className="py-24 text-center">
            <p className="text-white/40 text-sm sm:text-base font-medium">
              Chưa có phim nào trong danh sách yêu thích
            </p>
          </div>
        ) : (
          /* Movie Grid - Identical to standard categories */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {movies.map((movie: FavoriteItem, i: number) => (
              <div
                key={movie.slug}
                className="relative group/fav transform-gpu"
                style={{
                  opacity: 0,
                  animation: `fadeSlideUp 0.4s ease forwards`,
                  animationDelay: `${i * 0.04}s`,
                }}
              >
                <MovieCardEditorial
                  movie={{
                    slug: movie.slug,
                    name: movie.name,
                    origin_name: movie.origin_name,
                    thumb_url: movie.thumb_url,
                    poster_url: movie.poster_url,
                    year: typeof movie.year === "string" ? parseInt(movie.year, 10) : movie.year,
                    quality: movie.quality,
                    episode_current: movie.episode_current,
                    tmdb: movie.tmdb,
                    imdb: movie.imdb,
                  }}
                  hideFavoriteButton={true}
                />

                {/* Quick remove button on top-right on hover */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleRemove(movie.slug);
                  }}
                  className="absolute top-2.5 right-2.5 z-20 p-1.5 rounded-full bg-black/80 hover:bg-red-500/90 text-white/70 hover:text-white border border-white/20 hover:border-red-400 transition-all opacity-0 group-hover/fav:opacity-100 shadow-md active:scale-90 cursor-pointer"
                  title="Xóa khỏi yêu thích"
                  aria-label="Xóa khỏi yêu thích"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes fadeSlideUp {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
}
