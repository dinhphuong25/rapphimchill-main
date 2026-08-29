"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Play, Info, Star, Clock, Film, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFavorites } from "@/hooks/useLocalStorage";

interface HeroMovie {
  slug: string;
  name: string;
  origin_name?: string;
  thumb_url?: string;
  poster_url?: string;
  content?: string;
  quality?: string;
  year?: number;
  time?: string;
  category?: { name: string; slug: string }[];
  country?: { name: string; slug: string }[];
  imdb?: { rating: number };
  tmdb?: { vote_average: number };
  episode_current?: string;
}

interface HeroSectionProps {
  movies: HeroMovie[];
}

export default function HeroSection({ movies }: HeroSectionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const { toggleFavorite, isFavorite } = useFavorites();

  const validMovies = useMemo(() => {
    return (movies || []).filter((m) => m?.thumb_url || m?.poster_url).slice(0, 5);
  }, [movies]);

  const current = validMovies[currentIndex];

  const goTo = useCallback(
    (index: number) => {
      if (isTransitioning || index === currentIndex) return;
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex(index);
        setIsTransitioning(false);
      }, 250);
    },
    [isTransitioning, currentIndex]
  );

  const next = useCallback(() => {
    if (validMovies.length <= 1) return;
    goTo((currentIndex + 1) % validMovies.length);
  }, [currentIndex, validMovies.length, goTo]);

  // Auto-slide every 7 seconds
  useEffect(() => {
    if (isPaused || validMovies.length <= 1) return;
    const timer = setInterval(next, 7000);
    return () => clearInterval(timer);
  }, [next, isPaused, validMovies.length]);

  if (!current || !current.slug) return null;

  const backdropUrl = current.thumb_url || current.poster_url || "";
  const rawRating = current.imdb?.rating || current.tmdb?.vote_average;
  const rating = Number(rawRating);
  const isValidRating = !isNaN(rating) && rating > 0;

  const cleanContent = current.content
    ? current.content
        .replace(/<[^>]*>/g, "")
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, "&")
        .replace(/&#39;/g, "'")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&nbsp;/g, " ")
        .trim()
    : "";

  const countryName = current.country && current.country.length > 0 ? current.country[0].name : "";

  return (
    <section
      className="relative w-full overflow-hidden select-none bg-cinema-bg"
      style={{ height: "clamp(540px, 84vh, 760px)" }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      aria-label="Phim Nổi Bật"
    >
      {/* Background Image Fullscreen */}
      <div
        className={cn(
          "absolute inset-0 w-full h-full transition-all duration-700 ease-in-out",
          isTransitioning ? "opacity-0 scale-105" : "opacity-100 scale-100"
        )}
      >
        <Image
          src={backdropUrl}
          alt={current.name}
          fill
          priority
          loading="eager"
          fetchPriority="high"
          className="object-cover object-top"
          sizes="(max-width: 768px) 100vw, (max-width: 1440px) 100vw, 1920px"
          quality={75}
        />
        {/* Cinematic Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-cinema-bg via-cinema-bg/80 to-transparent w-full md:w-[75%]" />
        <div className="absolute inset-0 bg-gradient-to-t from-cinema-bg via-cinema-bg/20 to-transparent opacity-100" />
        <div className="absolute inset-0 bg-black/10" />
      </div>

      {/* Hero Main Editorial Grid Layout */}
      <div className="relative z-20 h-full max-w-[1600px] mx-auto px-4 sm:px-8 flex items-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-16 lg:pt-8">
          
          {/* Left Information Column */}
          <div className="lg:col-span-8 xl:col-span-7 space-y-4 pr-0 lg:pr-24 relative z-40">
            
            {/* Giant Slide Index Number + Subtitle */}
            <div className="flex items-center gap-4">
              <span className="text-5xl lg:text-7xl font-black text-white/10 tracking-tighter font-mono -ml-1">
                {String(currentIndex + 1).padStart(2, "0")}
              </span>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] md:text-xs font-extrabold text-brand-green uppercase tracking-[0.2em] drop-shadow-[0_0_10px_rgba(32,214,107,0.4)]">
                  PHIM NỔI BẬT HÔM NAY
                </span>
                <div className="h-0.5 w-16 bg-gradient-to-r from-brand-green to-transparent rounded-full" />
              </div>
            </div>

            {/* Movie Title */}
            <div
              className={cn(
                "transition-all duration-400",
                isTransitioning ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"
              )}
            >
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-[40px] font-black text-white leading-[1.2] tracking-tight drop-shadow-lg">
                {current.name}
              </h1>
              {current.origin_name && current.origin_name !== current.name && (
                <p className="text-xs sm:text-sm md:text-base text-white/70 mt-1.5 font-semibold tracking-wide drop-shadow-md">
                  {current.origin_name}
                </p>
              )}
            </div>

            {/* Metadata Line */}
            <div
              className={cn(
                "flex flex-wrap items-center gap-2.5 text-xs text-cinema-text-muted transition-all duration-400",
                isTransitioning ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"
              )}
            >
              {[
                current.year ? <span key="year" className="font-semibold text-white">{current.year}</span> : null,
                current.time ? <span key="time">{current.time}</span> : null,
                countryName ? <span key="country">{countryName}</span> : null,
                isValidRating ? (
                  <span key="rating" className="inline-flex items-center gap-1 font-bold text-cinema-gold">
                    <Star className="w-3.5 h-3.5 fill-cinema-gold" />
                    {rating.toFixed(1)}
                  </span>
                ) : null,
              ]
                .filter(Boolean)
                .map((item, idx, arr) => (
                  <span key={idx} className="flex items-center gap-2.5">
                    {item}
                    {idx < arr.length - 1 && <span className="text-white/30">•</span>}
                  </span>
                ))}
              {current.quality && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/10 text-white border border-white/15 ml-1">
                  {current.quality}
                </span>
              )}
            </div>

            {/* Description */}
            {cleanContent && (
              <p
                className={cn(
                  "text-sm text-white/60 leading-relaxed line-clamp-3 max-w-2xl transition-all duration-400 font-medium drop-shadow-md",
                  isTransitioning ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"
                )}
              >
                {cleanContent}
              </p>
            )}

            {/* CTA Action Buttons - Single Row on Mobile */}
            <div
              className={cn(
                "flex flex-row items-center gap-2.5 sm:gap-4 pt-3 sm:pt-4 transition-all duration-400",
                isTransitioning ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"
              )}
            >
              {/* Primary Watch Button */}
              <Link
                href={`/watch?slug=${current.slug}`}
                className="group flex items-center justify-center gap-2 sm:gap-3 px-5 sm:px-8 py-2.5 sm:py-3.5 bg-brand-green text-cinema-bg font-extrabold rounded-full hover:bg-brand-green-hover active:scale-95 transition-all shadow-[0_0_30px_rgba(32,214,107,0.3)] hover:shadow-[0_0_40px_rgba(32,214,107,0.5)] text-xs sm:text-sm uppercase tracking-wide shrink-0"
              >
                <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-cinema-bg group-hover:scale-110 transition-transform" />
                <span>Xem Ngay</span>
              </Link>

              {/* Info Button */}
              <Link
                href={`/phim/${current.slug}`}
                className="flex items-center justify-center gap-1.5 sm:gap-2.5 px-4 sm:px-7 py-2.5 sm:py-3.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-full border border-white/10 active:scale-95 transition-all text-xs sm:text-sm backdrop-blur-md uppercase tracking-wide shrink-0"
              >
                <Info className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Chi Tiết</span>
              </Link>

              {/* Bookmark / Favorite Toggle */}
              <button
                onClick={() =>
                  toggleFavorite({
                    slug: current.slug,
                    name: current.name,
                    thumb_url: backdropUrl,
                    year: current.year,
                    quality: current.quality,
                  })
                }
                aria-label="Lưu phim yêu thích"
                className={cn(
                  "p-2.5 sm:p-3.5 rounded-full border transition-all active:scale-95 backdrop-blur-md shrink-0",
                  isFavorite(current.slug)
                    ? "bg-brand-green/20 border-brand-green/50 text-brand-green shadow-[0_0_20px_rgba(32,214,107,0.2)]"
                    : "bg-white/10 hover:bg-white/20 border-white/10 text-white hover:text-white"
                )}
              >
                <Heart className={cn("w-4 h-4 sm:w-5 sm:h-5", isFavorite(current.slug) && "fill-brand-green")} />
              </button>
            </div>

            {/* Mobile Slide Dots */}
            <div className="flex lg:hidden items-center gap-1.5 pt-3">
              {validMovies.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => goTo(idx)}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-300",
                    idx === currentIndex ? "w-6 bg-brand-green" : "w-1.5 bg-white/30"
                  )}
                  aria-label={`Slide ${idx + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Right Bottom Horizontal Thumbnail Selector List */}
          <div className="hidden lg:flex absolute bottom-8 right-4 sm:right-8 z-30 flex-row items-end gap-2.5">
            {validMovies.map((movie, idx) => {
              const isActive = idx === currentIndex;
              return (
                <button
                  key={movie.slug}
                  onClick={() => goTo(idx)}
                  className={cn(
                    "relative overflow-hidden rounded-xl transition-all duration-500 group border-2 shadow-xl shrink-0",
                    isActive
                      ? "w-40 h-24 border-brand-green shadow-[0_0_20px_rgba(32,214,107,0.3)] scale-100"
                      : "w-24 h-14 border-white/20 hover:border-white/50 opacity-60 hover:opacity-100 hover:scale-105 hover:-translate-y-1"
                  )}
                >
                  <Image
                    src={movie.thumb_url || movie.poster_url || ""}
                    alt={movie.name}
                    fill
                    quality={70}
                    className={cn("object-cover transition-transform duration-700", isActive ? "scale-105" : "group-hover:scale-110")}
                    sizes="(max-width: 768px) 100px, 200px"
                  />
                  {/* Overlay for inactive */}
                  {!isActive && <div className="absolute inset-0 bg-black/40 group-hover:bg-transparent transition-colors duration-300" />}
                  
                  {/* Progress Line for active */}
                  {isActive && (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                      <div className="absolute bottom-2 left-2 right-2 flex flex-col items-start text-left">
                        <span className="text-[9px] font-black text-brand-green uppercase tracking-widest drop-shadow-md">Đang Chiếu</span>
                        <h4 className="text-xs font-bold text-white truncate w-full drop-shadow-md">{movie.name}</h4>
                      </div>
                      <div className="absolute bottom-0 left-0 h-1 bg-brand-green w-full" />
                    </>
                  )}
                </button>
              );
            })}
          </div>

        </div>
      </div>
    </section>
  );
}
