"use client";

import { useState, useMemo, memo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Play, Star, Heart, Film } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFavorites } from "@/hooks/useLocalStorage";
import { MotionCard } from "@/components/motion/motion-primitives";
import { getMovieImageCandidates, STATIC_BLUR_DATA_URL } from "@/lib/image-helper";

export interface MovieCardEditorialProps {
  movie: {
    _id?: string;
    slug: string;
    name: string;
    origin_name?: string;
    thumb_url?: string;
    poster_url?: string;
    year?: number | string;
    quality?: string;
    lang?: string;
    episode_current?: string;
    imdb?: { rating?: number };
    tmdb?: { vote_average?: number };
  };
  priority?: boolean;
  hideFavoriteButton?: boolean;
}

export const MovieCardEditorial = memo(function MovieCardEditorial({
  movie,
  priority = false,
  hideFavoriteButton = false,
}: MovieCardEditorialProps) {
  const { toggleFavorite, isFavorite } = useFavorites();
  const [candidateIndex, setCandidateIndex] = useState(0);
  const [hasError, setHasError] = useState(false);

  const candidates = useMemo(
    () => getMovieImageCandidates(movie, "poster"),
    [movie?.thumb_url, movie?.poster_url]
  );

  if (!movie || !movie.slug) return null;

  const currentSrc = !hasError && candidates.length > 0 ? candidates[candidateIndex] : null;

  const handleImageError = () => {
    if (candidateIndex + 1 < candidates.length) {
      setCandidateIndex((prev) => prev + 1);
    } else {
      setHasError(true);
    }
  };

  const rawRating = movie.imdb?.rating || movie.tmdb?.vote_average;
  const rating = Number(rawRating);
  const isValidRating = !isNaN(rating) && rating > 0;
  const isFav = isFavorite(movie.slug);

  return (
    <MotionCard className="group relative flex flex-col h-full select-none" style={{ contentVisibility: "auto", containIntrinsicSize: "200px 300px" }}>
      {/* Poster Image Container Wrapper */}
      <div className="relative w-full aspect-[2/3] rounded-xl overflow-hidden bg-cinema-surface border border-white/10 group-hover:border-brand-green/60 transition-[border-color,box-shadow] duration-300 shadow-xl group-hover:shadow-[0_12px_32px_rgba(32,214,107,0.25)] transform-gpu">
        
        <Link
          href={`/watch?slug=${movie.slug}`}
          className="absolute inset-0 z-0 block"
        >
        {currentSrc ? (
          <Image
            src={currentSrc}
            alt={movie.name}
            fill
            priority={priority}
            placeholder="blur"
            blurDataURL={STATIC_BLUR_DATA_URL}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            quality={75}
            onError={handleImageError}
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="absolute inset-0 bg-[#0c1310] flex flex-col items-center justify-center p-4 text-center select-none">
            <div className="w-12 h-12 rounded-full bg-brand-green/10 border border-brand-green/30 flex items-center justify-center mb-2 text-brand-green shadow-[0_0_15px_rgba(32,214,107,0.15)]">
              <Film className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-white/90 line-clamp-2 leading-tight mb-1">
              {movie.name}
            </span>
            <span className="text-[10px] font-mono text-brand-green/80">
              {movie.year || "Hi Phim"}
            </span>
          </div>
        )}

        {/* Poster Gradient Mask */}
        <div className="absolute inset-0 bg-gradient-to-t from-cinema-bg via-transparent to-transparent opacity-80 group-hover:opacity-40 transition-opacity" />

        {/* Quality & Lang Badges Top Left */}
        <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5 flex-wrap max-w-[80%]">
          {movie.quality && (
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider uppercase bg-black/80 text-white border border-white/15 shadow-sm">
              {movie.quality}
            </span>
          )}
          {movie.lang && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold tracking-wide uppercase bg-emerald-950/80 text-brand-green border border-brand-green/30 shadow-sm">
              {movie.lang.includes("Thuyết") ? "Thuyết Minh" : movie.lang.includes("Lồng") ? "Lồng Tiếng" : "Vietsub"}
            </span>
          )}
        </div>

        {/* Rating Badge Top Right (font-mono aitmpl style) */}
        {isValidRating && (
          <span className="absolute top-2.5 right-2.5 z-10 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-black/80 text-cinema-gold border border-white/15 flex items-center gap-1 shadow-sm">
            <Star className="w-3 h-3 fill-cinema-gold" />
            {rating.toFixed(1)}
          </span>
        )}

        {/* Center Hover Play Button */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/40 backdrop-blur-[2px]">
          <div className="w-12 h-12 rounded-full bg-brand-green flex items-center justify-center text-cinema-bg shadow-[0_0_22px_rgba(32,214,107,0.6)] scale-90 group-hover:scale-100 transition-transform duration-200">
            <Play className="w-5 h-5 fill-cinema-bg ml-0.5" />
          </div>
        </div>

        {/* Current Episode Badge Bottom Left */}
        {movie.episode_current && movie.episode_current !== "Full" && (
          <span className="absolute bottom-2.5 left-2.5 z-10 text-[10px] font-mono font-semibold text-white/80 bg-black/80 px-2 py-0.5 rounded border border-white/10 truncate max-w-[80%]">
            {movie.episode_current}
          </span>
        )}
        </Link>

        {/* Favorite Toggle Button */}
        {!hideFavoriteButton && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleFavorite({
                slug: movie.slug,
                name: movie.name,
                origin_name: movie.origin_name,
                thumb_url: currentSrc || movie.thumb_url || movie.poster_url || "",
                poster_url: movie.poster_url,
                year: typeof movie.year === "string" ? parseInt(movie.year, 10) : movie.year,
                quality: movie.quality,
                episode_current: movie.episode_current,
                tmdb: movie.tmdb,
                imdb: movie.imdb,
              });
            }}
            aria-label="Yêu thích"
            className={cn(
              "absolute bottom-2.5 right-2.5 z-20 p-2 rounded-full border transition-colors active:scale-90 opacity-0 group-hover:opacity-100",
              isFav
                ? "bg-brand-green/20 border-brand-green text-brand-green opacity-100"
                : "bg-black/60 border-white/15 text-white/70 hover:text-white"
            )}
          >
            <Heart className={cn("w-3.5 h-3.5", isFav && "fill-brand-green")} />
          </button>
        )}
      </div>

      {/* Info Under Poster */}
      <div className="mt-2.5 flex flex-col">
        <Link
          href={`/watch?slug=${movie.slug}`}
          className="text-xs font-bold text-cinema-text hover:text-brand-green transition-colors line-clamp-1 flex items-center justify-between group/title"
        >
          <span className="truncate">{movie.name}</span>
          <span className="font-mono text-brand-green opacity-0 group-hover/title:opacity-100 transition-opacity ml-1 shrink-0 text-sm">›</span>
        </Link>
        <div className="flex items-center justify-between gap-2 text-[11px] font-mono text-cinema-text-dim mt-0.5">
          <span className="shrink-0">{movie.year || "2025"}</span>
          {movie.origin_name && <span className="truncate font-sans text-right">{movie.origin_name}</span>}
        </div>
      </div>
    </MotionCard>
  );
});

export default MovieCardEditorial;
