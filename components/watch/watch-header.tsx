"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WatchHeaderProps {
  movieName: string;
  movieSlug: string;
  currentEpName?: string;
}

export default function WatchHeader({
  movieName,
  movieSlug,
  currentEpName,
}: WatchHeaderProps) {
  const router = useRouter();

  return (
    <div className="sticky top-0 z-40 w-full max-w-[1800px] mx-auto transition-all shrink-0">
      <header className="w-full bg-[#0a0a0a]/90 backdrop-blur-2xl border-x border-b border-white/10 rounded-b-2xl sm:rounded-b-3xl px-4 sm:px-6 py-2.5 shadow-2xl">
        <div className="flex items-center justify-between gap-4">
        
        {/* Left: Back button & Breadcrumb Title */}
        <div className="flex items-center gap-3 min-w-0">
          <Button
            onClick={() => {
              if (window.history.length > 1) {
                router.back();
              } else {
                router.push("/");
              }
            }}
            variant="ghost"
            size="sm"
            className="text-white/80 hover:text-white hover:bg-white/10 rounded-xl px-2.5 sm:px-3 py-2 flex items-center gap-2 border border-white/10 shrink-0"
            title="Quay lại"
          >
            <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-brand-green" />
            <span className="text-xs font-bold">Trở về</span>
          </Button>

          <div className="h-4 w-px bg-white/10 hidden sm:block shrink-0" />

          {/* Breadcrumb info */}
          <div className="flex items-center gap-2 min-w-0 text-xs sm:text-sm">
            <Link
              href="/"
              className="text-white/50 hover:text-brand-green transition-colors flex items-center gap-1 shrink-0"
            >
              <Home className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Trang chủ</span>
            </Link>
            <span className="text-white/30 shrink-0">/</span>
            <span
              className="text-white/90 font-semibold truncate max-w-[140px] sm:max-w-[260px] md:max-w-[360px]"
            >
              {movieName}
            </span>
            {currentEpName && (
              <>
                <span className="text-white/30 shrink-0">/</span>
                <span className="text-brand-green font-bold truncate max-w-[100px] sm:max-w-[160px]">
                  {currentEpName}
                </span>
              </>
            )}
          </div>
        </div>

        </div>
      </header>
    </div>
  );
}
