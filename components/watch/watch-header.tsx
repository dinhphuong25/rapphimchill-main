"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import BrandLogo from "@/components/ui/brand-logo";

interface WatchHeaderProps {
  movieName: string;
  movieSlug: string;
  currentEpName?: string;
  currentTime?: number;
  episodeIndex?: number;
}

export default function WatchHeader({
  movieName,
  currentEpName,
}: WatchHeaderProps) {
  const router = useRouter();

  return (
    <div className="sticky top-0 z-40 w-full max-w-[1600px] mx-auto transition-all shrink-0">
      <header className="w-full bg-[#0a0a0a]/90 backdrop-blur-2xl border-x border-b border-white/10 rounded-b-2xl sm:rounded-b-3xl px-2.5 sm:px-6 py-2 sm:py-2.5 relative select-none">
        <div className="flex items-center justify-between gap-1.5 sm:gap-4 w-full">
          {/* Left: Back button (Far left corner) */}
          <Button
            onClick={() => {
              if (typeof window !== "undefined" && window.history.length > 1) {
                router.back();
              } else {
                router.push("/");
              }
            }}
            variant="ghost"
            size="sm"
            className="text-white/85 hover:text-white hover:bg-white/10 rounded-xl px-2.5 sm:px-3 py-1.5 sm:py-2 flex items-center gap-1.5 sm:gap-2 border border-white/10 shrink-0 cursor-pointer shadow-sm active:scale-95"
            title="Quay lại"
          >
            <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-brand-green shrink-0" />
            <span className="text-xs font-bold whitespace-nowrap hidden xs:inline">Trở về</span>
          </Button>

          {/* Center: Logo với tên phim ở giữa thanh header mobile & desktop */}
          <div className="flex items-center justify-center gap-1.5 sm:gap-2.5 min-w-0 flex-1 px-1 sm:px-2 text-center overflow-hidden">
            <Link
              href="/"
              className="flex items-center shrink-0 hover:opacity-85 active:scale-95 transition-all"
              title="Về trang chủ Hi Phim"
            >
              <BrandLogo size="sm" showSlogan={false} />
            </Link>

            <span className="text-white/20 select-none font-light shrink-0">|</span>

            <div className="flex items-center gap-1 sm:gap-1.5 min-w-0 truncate">
              <span className="text-white font-bold truncate text-xs sm:text-sm tracking-tight" title={movieName}>
                {movieName}
              </span>
              {currentEpName && (
                <>
                  <span className="text-white/30 shrink-0 text-xs">/</span>
                  <span className="text-brand-green font-bold truncate text-xs sm:text-sm shrink-0">
                    {currentEpName}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Right: Quick Home button balancing back button */}
          <div className="flex items-center justify-end shrink-0">
            <Link
              href="/"
              className="text-white/80 hover:text-white hover:bg-white/10 rounded-xl px-2.5 sm:px-3 py-1.5 sm:py-2 flex items-center gap-1.5 border border-white/10 text-xs font-semibold transition-all active:scale-95"
              title="Về trang chủ"
            >
              <Home className="w-3.5 h-3.5 text-brand-green shrink-0" />
              <span className="hidden sm:inline">Trang chủ</span>
            </Link>
          </div>
        </div>
      </header>
    </div>
  );
}
