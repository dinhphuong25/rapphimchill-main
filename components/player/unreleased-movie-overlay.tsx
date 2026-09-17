"use client";

import Link from "next/link";
import { Film, Clock, Heart, ExternalLink, Home, Sparkles } from "lucide-react";
import { normalizeImageUrl } from "@/lib/image-helper";
import { cn } from "@/lib/utils";

interface UnreleasedMovieOverlayProps {
  movie: {
    name: string;
    origin_name?: string;
    thumb_url?: string;
    poster_url?: string;
    trailer_url?: string;
    year?: number | string;
    episode_current?: string;
    quality?: string;
  };
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

export default function UnreleasedMovieOverlay({
  movie,
  isFavorite = false,
  onToggleFavorite,
}: UnreleasedMovieOverlayProps) {
  const bgImage = normalizeImageUrl(movie.poster_url || movie.thumb_url || "");
  const hasYoutubeTrailer = Boolean(
    movie.trailer_url &&
      (movie.trailer_url.includes("youtube.com") || movie.trailer_url.includes("youtu.be"))
  );

  return (
    <div className="relative w-full h-full min-h-[360px] sm:min-h-[440px] md:min-h-[480px] flex items-center justify-center overflow-hidden rounded-2xl lg:rounded-3xl bg-[#09090b] select-none">
      {/* Background Poster with Cinematic Ambient Blur */}
      {bgImage && (
        <div
          className="absolute inset-0 bg-cover bg-center filter blur-xl scale-110 opacity-30 pointer-events-none transition-all duration-700"
          style={{ backgroundImage: `url(${bgImage})` }}
        />
      )}

      {/* Dark Gradient Overlay & Radial Vignette */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-[#09090b]/85 to-[#09090b]/60 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-[#09090b]/60 to-[#09090b] pointer-events-none" />

      {/* Decorative Top/Bottom Accent Glow */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />
      <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-brand-green/30 to-transparent" />

      {/* Main Notice Content Container */}
      <div className="relative z-10 max-w-xl w-full mx-auto px-5 py-8 text-center flex flex-col items-center justify-center">
        {/* Animated Status Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 mb-4 shadow-[0_0_20px_rgba(245,158,11,0.15)] animate-pulse">
          <Clock className="w-3.5 h-3.5 shrink-0" />
          <span className="text-xs font-black uppercase tracking-wider">
            {movie.episode_current?.toLowerCase().includes("trailer")
              ? "Bản Chiếu Chưa Công Bố • Đang Cập Nhật"
              : "Phim Sắp Chiếu • Chưa Có Bản Phát Hành"}
          </span>
        </div>

        {/* Movie Title */}
        <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight leading-snug drop-shadow-md mb-2">
          {movie.name}
        </h2>
        {movie.origin_name && movie.origin_name !== movie.name && (
          <p className="text-xs sm:text-sm text-white/50 font-medium italic mb-4">
            {movie.origin_name} {movie.year ? `(${movie.year})` : ""}
          </p>
        )}

        {/* Informative Explanation Card */}
        <div className="w-full bg-white/[0.04] backdrop-blur-md border border-white/10 rounded-2xl p-4 sm:p-5 mb-6 shadow-xl">
          <div className="flex items-center justify-center gap-2 text-brand-green text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-4 h-4 shrink-0 animate-spin [animation-duration:6s]" />
            <span>Thông Báo Từ Hệ Thống</span>
          </div>
          <p className="text-xs sm:text-sm text-white/80 leading-relaxed max-w-md mx-auto">
            Phim hiện tại mới chỉ có thông tin giới thiệu hoặc bản phát hành chính thức chưa được nhà sản xuất công bố trên hệ thống phát trực tuyến.
          </p>
          <div className="mt-3 pt-3 border-t border-white/[0.08] text-[11px] sm:text-xs text-white/50 flex items-center justify-center gap-1.5">
            <Film className="w-3.5 h-3.5 text-brand-green/80 shrink-0" />
            <span>Bản phim đầy đủ chuẩn FHD/4K sẽ tự động cập nhật ngay khi được phát hành.</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 w-full">
          {/* Favorite button */}
          {onToggleFavorite && (
            <button
              onClick={onToggleFavorite}
              type="button"
              className={cn(
                "px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all duration-200 shadow-lg active:scale-95 cursor-pointer border",
                isFavorite
                  ? "bg-brand-green text-black border-brand-green shadow-[0_0_20px_rgba(34,197,94,0.4)]"
                  : "bg-white/10 hover:bg-white/20 text-white border-white/15 hover:border-white/30"
              )}
            >
              <Heart
                className={cn(
                  "w-4 h-4 shrink-0 transition-transform",
                  isFavorite ? "fill-black text-black" : "text-white"
                )}
              />
              <span>{isFavorite ? "Đã Lưu Theo Dõi" : "Lưu Theo Dõi Phim Này"}</span>
            </button>
          )}

          {/* External Trailer Button if YouTube URL exists */}
          {hasYoutubeTrailer && movie.trailer_url && (
            <a
              href={movie.trailer_url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-400 hover:text-red-300 border border-red-500/40 font-bold text-xs sm:text-sm flex items-center gap-2 transition-all duration-200 shadow-lg active:scale-95"
            >
              <ExternalLink className="w-4 h-4 shrink-0" />
              <span>Xem Trailer Trên YouTube</span>
            </a>
          )}

          {/* Back Home / Discover Movies */}
          <Link
            href="/"
            className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/10 font-bold text-xs sm:text-sm flex items-center gap-2 transition-all duration-200 active:scale-95"
          >
            <Home className="w-4 h-4 shrink-0" />
            <span>Khám Phá Phim Khác</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
