"use client";

import { Film, Sparkles } from "lucide-react";
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

      {/* Informative Explanation Card Only */}
      <div className="relative z-10 max-w-lg w-full mx-auto px-4 py-6 text-center flex flex-col items-center justify-center">
        <div className="w-full bg-white/[0.04] backdrop-blur-md border border-white/10 rounded-2xl p-5 sm:p-6 shadow-2xl">
          <div className="flex items-center justify-center gap-2 text-brand-green text-xs sm:text-sm font-bold uppercase tracking-wider mb-2.5">
            <Sparkles className="w-4 h-4 shrink-0 animate-spin [animation-duration:6s]" />
            <span>Thông Báo Từ Hệ Thống</span>
          </div>
          <p className="text-xs sm:text-sm text-white/85 leading-relaxed max-w-md mx-auto">
            Phim hiện tại mới chỉ có thông tin giới thiệu hoặc bản phát hành chính thức chưa được nhà sản xuất công bố trên hệ thống phát trực tuyến.
          </p>
          <div className="mt-3.5 pt-3.5 border-t border-white/[0.08] text-[11px] sm:text-xs text-white/50 flex items-center justify-center gap-1.5">
            <Film className="w-3.5 h-3.5 text-brand-green/80 shrink-0" />
            <span>Bản phim đầy đủ chuẩn FHD/4K sẽ tự động cập nhật ngay khi được phát hành.</span>
          </div>
        </div>
      </div>
    </div>
  );
}

