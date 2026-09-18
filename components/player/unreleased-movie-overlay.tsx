"use client";

import { normalizeImageUrl } from "@/lib/image-helper";

interface UnreleasedMovieOverlayProps {
  movie: {
    name?: string;
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
}: UnreleasedMovieOverlayProps) {
  const bgImage = normalizeImageUrl(movie?.poster_url || movie?.thumb_url || "");

  return (
    <div className="relative w-full h-full min-h-[340px] sm:min-h-[420px] md:min-h-[460px] flex items-center justify-center overflow-hidden rounded-2xl lg:rounded-3xl bg-[#09090b] select-none p-4">
      {/* Background Poster with Cinematic Ambient Blur */}
      {bgImage && (
        <div
          className="absolute inset-0 bg-cover bg-center filter blur-xl scale-110 opacity-25 pointer-events-none transition-all duration-700"
          style={{ backgroundImage: `url(${bgImage})` }}
        />
      )}

      {/* Dark Gradient Overlay & Radial Vignette */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-[#09090b]/85 to-[#09090b]/60 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-[#09090b]/60 to-[#09090b] pointer-events-none" />

      {/* Decorative Top/Bottom Accent Glow */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-brand-green/30 to-transparent" />
      <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-brand-green/20 to-transparent" />

      {/* Direct In-Player Notification Content (No Box/Card) */}
      <div className="relative z-10 max-w-2xl w-full mx-auto px-4 sm:px-6 py-6 text-center flex flex-col items-center justify-center gap-3 sm:gap-4">
        <h3 className="text-brand-green text-base sm:text-lg md:text-xl font-black uppercase tracking-widest drop-shadow-[0_0_16px_rgba(32,214,107,0.35)]">
          Thông Báo Từ Hệ Thống
        </h3>
        <p className="text-sm sm:text-base md:text-lg lg:text-xl text-white/90 font-medium leading-relaxed max-w-xl mx-auto">
          Phim hiện tại mới chỉ có thông tin giới thiệu hoặc bản phát hành chính thức chưa được nhà sản xuất công bố trên hệ thống phát trực tuyến.
        </p>
        <p className="text-xs sm:text-sm md:text-base text-white/50 font-normal max-w-lg mx-auto pt-1">
          Bản phim đầy đủ chuẩn FHD/4K sẽ tự động cập nhật ngay khi được phát hành.
        </p>
      </div>
    </div>
  );
}

