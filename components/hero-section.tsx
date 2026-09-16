"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Play,
  Info,
  Star,
  Clock,
  Flame,
  Film,
  Heart,
  ChevronLeft,
  ChevronRight,
  Tv,
  Users,
  Clapperboard,
  Sparkles,
  Volume2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useFavorites } from "@/hooks/useLocalStorage";
import { useUserAuth } from "@/context/user-auth-context";
import { getMovieImageCandidates } from "@/lib/image-helper";

function HeroThumbImage({ movie, isActive }: { movie: any; isActive: boolean }) {
  const [candidateIdx, setCandidateIdx] = useState(0);
  const [hasError, setHasError] = useState(false);
  const candidates = useMemo(() => getMovieImageCandidates(movie, "thumb"), [movie]);
  const src = !hasError && candidates.length > 0 ? candidates[candidateIdx] : null;

  if (!src) {
    return (
      <div className="w-full h-full bg-[#0c1310] flex items-center justify-center p-2 text-center">
        <Film className="w-5 h-5 text-brand-green/60" />
      </div>
    );
  }

  return (
    <div className="relative w-full h-full overflow-hidden">
      <Image
        src={src}
        alt={movie.name}
        fill
        sizes="(max-width: 1024px) 140px, 180px"
        className="object-cover"
        quality={70}
        loading="lazy"
        onError={() => {
          if (candidateIdx + 1 < candidates.length) {
            setCandidateIdx((i) => i + 1);
          } else {
            setHasError(true);
          }
        }}
      />
    </div>
  );
}

interface HeroMovie {
  slug: string;
  name: string;
  origin_name?: string;
  thumb_url?: string;
  poster_url?: string;
  content?: string;
  quality?: string;
  lang?: string;
  year?: number;
  time?: string;
  category?: { name: string; slug: string }[];
  country?: { name: string; slug: string }[];
  director?: string[] | string;
  actor?: string[] | string;
  imdb?: { rating: number };
  tmdb?: { vote_average: number };
  episode_current?: string;
  episode_total?: string;
  view?: number;
}

interface HeroSectionProps {
  movies: HeroMovie[];
}

const AUTO_SLIDE_DURATION = 7000; // 7 seconds

export default function HeroSection({ movies }: HeroSectionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const { user, checkAuthOrPrompt, updateServerData } = useUserAuth();
  const { toggleFavorite, isFavorite } = useFavorites();

  const validMovies = useMemo(() => {
    return (movies || []).filter((m) => m?.thumb_url || m?.poster_url).slice(0, 7);
  }, [movies]);

  const current = validMovies[currentIndex] || validMovies[0];

  const backdropCandidates = useMemo(
    () => getMovieImageCandidates(current, "backdrop"),
    [current]
  );
  const [backdropIdx, setBackdropIdx] = useState(0);
  const [backdropError, setBackdropError] = useState(false);

  useEffect(() => {
    setBackdropIdx(0);
    setBackdropError(false);
  }, [currentIndex]);

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

  const prev = useCallback(() => {
    if (validMovies.length <= 1) return;
    goTo((currentIndex - 1 + validMovies.length) % validMovies.length);
  }, [currentIndex, validMovies.length, goTo]);

  // Auto-slide timer
  useEffect(() => {
    if (isPaused || validMovies.length <= 1) return;
    const timer = setInterval(next, AUTO_SLIDE_DURATION);
    return () => clearInterval(timer);
  }, [next, isPaused, validMovies.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [next, prev]);

  // Touch Swipe Gestures for Mobile devices (60/120fps responsive)
  const touchStartXRef = useRef<number | null>(null);
  const touchEndXRef = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndXRef.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartXRef.current === null || touchEndXRef.current === null) return;
    const distance = touchStartXRef.current - touchEndXRef.current;
    const minSwipeDistance = 45; // 45px swipe threshold
    if (distance > minSwipeDistance) {
      next();
    } else if (distance < -minSwipeDistance) {
      prev();
    }
    touchStartXRef.current = null;
    touchEndXRef.current = null;
  };

  if (!current || !current.slug) return null;

  const backdropUrl =
    !backdropError && backdropCandidates.length > 0
      ? backdropCandidates[backdropIdx]
      : "";
  const rawRating = current.imdb?.rating || current.tmdb?.vote_average;
  const rating = Number(rawRating);
  const isValidRating = !isNaN(rating) && rating > 0;

  // Clean HTML from content string
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

  const countryName =
    current.country && current.country.length > 0
      ? current.country.map((c) => c.name).join(", ")
      : "";

  const categories = Array.isArray(current.category) ? current.category : [];

  // Parse actors & directors
  const actorsList = Array.isArray(current.actor)
    ? current.actor.filter(Boolean).slice(0, 3).join(", ")
    : typeof current.actor === "string" && current.actor
    ? current.actor
    : "";

  const directorName = Array.isArray(current.director)
    ? current.director.filter(Boolean).join(", ")
    : typeof current.director === "string" && current.director && current.director !== "Đang cập nhật"
    ? current.director
    : "";

  return (
    <section
      className="relative w-full overflow-hidden select-none bg-cinema-bg touch-pan-y"
      style={{ minHeight: "clamp(450px, 60vh, 560px)" }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      aria-label="Phim Nổi Bật Theo Xu Hướng"
    >
      {/* 1. Background Backdrop Image with Cross-fade Zoom */}
      <div
        className={cn(
          "absolute inset-0 w-full h-full transition-[opacity,transform] duration-700 ease-out transform-gpu will-change-transform will-change-opacity",
          isTransitioning ? "opacity-0 scale-105" : "opacity-100 scale-100"
        )}
      >
        {backdropUrl ? (
          <Image
            src={backdropUrl}
            alt={current.name}
            fill
            priority
            loading="eager"
            fetchPriority="high"
            className="object-cover object-top"
            sizes="(max-width: 768px) 100vw, (max-width: 1440px) 100vw, 1920px"
            quality={80}
            onError={() => {
              if (backdropIdx + 1 < backdropCandidates.length) {
                setBackdropIdx((i) => i + 1);
              } else {
                setBackdropError(true);
              }
            }}
          />
        ) : (
          <div className="absolute inset-0 bg-[#070b09]" />
        )}

        {/* Ambient Glow — desktop only, too heavy for mobile GPU */}
        <div className="hidden lg:block absolute -top-32 -left-32 w-96 h-96 bg-brand-green/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#050807] via-[#050807]/90 to-transparent w-full md:w-[78%] lg:w-[70%]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050807] via-[#050807]/30 to-transparent opacity-100" />
        <div className="absolute inset-0 bg-black/20" />
      </div>

      {/* 2. Main Editorial Content Container */}
      <div className="relative z-20 h-full max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 flex flex-col justify-center pt-16 sm:pt-20 pb-4 sm:pb-6 min-h-[inherit]">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Column: Movie Editorial & Rich Information */}
          <div className="lg:col-span-8 xl:col-span-7 space-y-4 pr-0 lg:pr-10 relative z-30">
            
            {/* Top Trending Ribbon Badge */}
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-green/15 border border-brand-green/35 text-brand-green text-xs font-black uppercase tracking-wider shadow-[0_0_15px_rgba(34,197,94,0.25)]">
                <Flame className="w-3.5 h-3.5 fill-brand-green animate-pulse text-brand-green" />
                <span>TOP #{String(currentIndex + 1).padStart(2, "0")} THỊNH HÀNH</span>
              </div>

              {current.quality && (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-white/10 text-white border border-white/15 font-mono shadow-sm">
                  {current.quality}
                </span>
              )}

              {current.lang && (
                <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/5 text-white/80 border border-white/10">
                  <Volume2 className="w-3 h-3 text-brand-green" />
                  {current.lang}
                </span>
              )}
            </div>

            {/* Movie Title & Subtitle */}
            <div
              className={cn(
                "transition-all duration-400 space-y-0.5 sm:space-y-1",
                isTransitioning ? "opacity-0 translate-y-3" : "opacity-100 translate-y-0"
              )}
            >
              <h1 className="text-lg sm:text-xl md:text-2xl lg:text-[24px] xl:text-[28px] font-black text-white leading-snug tracking-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)] line-clamp-1">
                {current.name}
              </h1>
              {current.origin_name && current.origin_name !== current.name && (
                <p className="text-xs sm:text-[13px] md:text-sm text-white/60 font-medium tracking-wide drop-shadow-md italic line-clamp-1">
                  {current.origin_name}
                </p>
              )}
            </div>

            {/* Comprehensive Metadata Badges Strip */}
            <div
              className={cn(
                "flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-white/75 transition-all duration-400 font-medium",
                isTransitioning ? "opacity-0 translate-y-3" : "opacity-100 translate-y-0"
              )}
            >
              {isValidRating && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-yellow-500/15 border border-yellow-500/30 text-yellow-400 font-bold shadow-sm">
                  <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                  <span>{rating.toFixed(1)}</span>
                  <span className="text-[10px] text-yellow-500/70 font-normal">/10</span>
                </div>
              )}

              {current.year && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-white font-semibold">
                  <span>{current.year}</span>
                </div>
              )}

              {current.time && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-white/80">
                  <Clock className="w-3 h-3 text-brand-green" />
                  <span>{current.time}</span>
                </div>
              )}

              {countryName && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-white/80">
                  <span>{countryName}</span>
                </div>
              )}

              {current.episode_current && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-brand-green/10 border border-brand-green/25 text-brand-green font-semibold">
                  <Tv className="w-3 h-3 text-brand-green" />
                  <span>{current.episode_current}</span>
                </div>
              )}
            </div>

            {/* Interactive Category / Genre Pills */}
            {categories.length > 0 && (
              <div
                className={cn(
                  "flex flex-wrap items-center gap-1.5 pt-1 transition-all duration-400",
                  isTransitioning ? "opacity-0 translate-y-3" : "opacity-100 translate-y-0"
                )}
              >
                {categories.slice(0, 4).map((cat, idx) => (
                  <Link
                    key={`${cat.slug}-${idx}`}
                    href={`/?category=${cat.slug}`}
                    className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-brand-green/20 border border-white/10 hover:border-brand-green/40 text-white/70 hover:text-brand-green text-[11px] font-semibold transition-all"
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            )}

            {/* Cast & Director Details */}
            {(directorName || actorsList) && (
              <div
                className={cn(
                  "space-y-1 text-xs text-white/60 pt-1 transition-all duration-400 hidden sm:block",
                  isTransitioning ? "opacity-0 translate-y-3" : "opacity-100 translate-y-0"
                )}
              >
                {directorName && (
                  <div className="flex items-center gap-2 truncate">
                    <Clapperboard className="w-3.5 h-3.5 text-brand-green shrink-0" />
                    <span className="text-white/40 font-medium">Đạo diễn:</span>
                    <span className="text-white/85 font-semibold truncate">{directorName}</span>
                  </div>
                )}
                {actorsList && (
                  <div className="flex items-center gap-2 truncate">
                    <Users className="w-3.5 h-3.5 text-brand-green shrink-0" />
                    <span className="text-white/40 font-medium">Diễn viên:</span>
                    <span className="text-white/85 font-semibold truncate">{actorsList}</span>
                  </div>
                )}
              </div>
            )}

            {/* Storyline Description */}
            {cleanContent && (
              <p
                className={cn(
                  "text-xs sm:text-sm text-white/65 leading-relaxed line-clamp-3 max-w-2xl transition-all duration-400 font-normal drop-shadow-md pt-1",
                  isTransitioning ? "opacity-0 translate-y-3" : "opacity-100 translate-y-0"
                )}
              >
                {cleanContent}
              </p>
            )}

            {/* CTA Action Buttons Strip */}
            <div
              className={cn(
                "flex flex-row items-center gap-3 sm:gap-4 pt-3 sm:pt-4 transition-all duration-400",
                isTransitioning ? "opacity-0 translate-y-3" : "opacity-100 translate-y-0"
              )}
            >
              {/* Primary Watch Button */}
              <Link
                href={`/watch?slug=${current.slug}`}
                className="group flex items-center justify-center gap-2.5 px-6 sm:px-8 py-3 sm:py-3.5 bg-brand-green text-cinema-bg font-extrabold rounded-full hover:bg-brand-green-hover active:scale-95 transition-all shadow-[0_0_30px_rgba(34,197,94,0.35)] hover:shadow-[0_0_45px_rgba(34,197,94,0.55)] text-xs sm:text-sm uppercase tracking-wide shrink-0"
              >
                <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-cinema-bg group-hover:scale-110 transition-transform" />
                <span>Xem Ngay</span>
              </Link>

              {/* Favorite Bookmark Button */}
              <button
                onClick={() => {
                  if (!checkAuthOrPrompt("lưu phim yêu thích")) return;
                  const updated = toggleFavorite({
                    slug: current.slug,
                    name: current.name,
                    thumb_url: backdropUrl,
                    year: current.year,
                    quality: current.quality,
                  });
                  if (user && updated) {
                    updateServerData({ favorites: updated });
                  }
                }}
                aria-label="Lưu phim yêu thích"
                className={cn(
                  "p-3 sm:p-3.5 rounded-full border transition-colors active:scale-95 shrink-0",
                  isFavorite(current.slug)
                    ? "bg-brand-green/20 border-brand-green/50 text-brand-green shadow-[0_0_20px_rgba(34,197,94,0.25)]"
                    : "bg-white/10 hover:bg-white/20 border-white/10 text-white hover:text-white"
                )}
              >
                <Heart className={cn("w-4 h-4 sm:w-5 sm:h-5", isFavorite(current.slug) && "fill-brand-green")} />
              </button>
            </div>

            {/* Mobile Navigation Dots */}
            <div className="flex lg:hidden items-center gap-2 pt-4">
              {validMovies.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => goTo(idx)}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-300",
                    idx === currentIndex ? "w-8 bg-brand-green shadow-[0_0_8px_rgba(34,197,94,0.8)]" : "w-2 bg-white/25 hover:bg-white/50"
                  )}
                  aria-label={`Slide ${idx + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Right Column: Interactive Thumbnail Carousel (Desktop & Large screens) */}
          <div className="hidden lg:flex lg:col-span-4 xl:col-span-5 flex-col items-end justify-end relative z-30 self-end pb-2">
            
            {/* Carousel Navigation Header */}
            <div className="flex items-center justify-between w-full mb-2.5 px-1">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-brand-green shrink-0" />
                <span className="text-[11px] font-bold text-white/75 tracking-wider uppercase select-none">
                  Danh Sách Ghim Nổi Bật
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={prev}
                  aria-label="Phim trước"
                  className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white border border-white/10 transition-all active:scale-95 cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={next}
                  aria-label="Phim tiếp theo"
                  className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white border border-white/10 transition-all active:scale-95 cursor-pointer"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Thumbnails Row */}
            <div className="flex items-center gap-3 overflow-x-auto pb-1 max-w-full scrollbar-hide">
              {validMovies.map((movie, idx) => {
                const isActive = idx === currentIndex;
                const thumb = movie.thumb_url || movie.poster_url || "";
                return (
                  <button
                    key={movie.slug}
                    onClick={() => goTo(idx)}
                    aria-label={`Chọn phim nổi bật ${movie.name}`}
                    className={cn(
                      "relative rounded-2xl overflow-hidden transition-[width,height,opacity,border-color] duration-300 text-left group border shadow-lg shrink-0 active:scale-95",
                      isActive
                        ? "w-48 h-28 border-brand-green/80 shadow-[0_0_20px_rgba(34,197,94,0.3)] scale-100 ring-2 ring-brand-green/30"
                        : "w-28 h-20 border-white/10 hover:border-white/40 opacity-60 hover:opacity-100 hover:scale-105"
                    )}
                  >
                    <HeroThumbImage movie={movie} isActive={isActive} />

                    {/* Inactive Dark Shade */}
                    {!isActive && (
                      <div className="absolute inset-0 bg-black/50 group-hover:bg-transparent transition-colors duration-200" />
                    )}

                    {/* Rank Badge — solid bg, no backdrop-blur */}
                    <span
                      className={cn(
                        "absolute top-2 left-2 px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold tracking-tight z-10 shadow-sm",
                        isActive
                          ? "bg-brand-green text-cinema-bg font-black"
                          : "bg-black/80 text-white/80 border border-white/10"
                      )}
                    >
                      #{idx + 1}
                    </span>

                    {/* Active Overlay with Title & Progress Bar */}
                    {isActive && (
                      <>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent z-10" />
                        <div className="absolute bottom-2 left-2.5 right-2.5 z-20 flex flex-col">
                          <span className="text-[9px] font-black text-brand-green uppercase tracking-widest drop-shadow-md">
                            ĐANG XEM
                          </span>
                          <p className="text-xs font-bold text-white truncate drop-shadow-md">
                            {movie.name}
                          </p>
                        </div>
                        {/* Auto-Slide Progress Bar - GPU Composited (No Reflow) */}
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 z-20 overflow-hidden">
                          <div
                            key={currentIndex}
                            className={cn(
                              "h-full w-full bg-brand-green origin-left transform-gpu will-change-transform",
                              !isPaused && "animate-progress-scale"
                            )}
                            style={{
                              animationDuration: `${AUTO_SLIDE_DURATION}ms`,
                              animationTimingFunction: "linear",
                            }}
                          />
                        </div>
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

