"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

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
      <header className="w-full bg-[#0a0a0a]/90 backdrop-blur-2xl border-x border-b border-white/10 rounded-b-2xl sm:rounded-b-3xl px-3 sm:px-6 py-2.5 relative">
        <div className="flex items-center justify-between gap-2 sm:gap-4 w-full">
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
            <span className="text-xs font-bold whitespace-nowrap">Trở về</span>
          </Button>

          {/* Right: Movie Title & Episode info */}
          <div className="flex items-center justify-end gap-2 sm:gap-3 min-w-0 text-xs sm:text-sm ml-auto text-right">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-white/90 font-semibold truncate max-w-[180px] xs:max-w-[240px] sm:max-w-[450px] md:max-w-[650px] lg:max-w-[850px]">
                {movieName}
              </span>
              {currentEpName && (
                <>
                  <span className="text-white/30 shrink-0">/</span>
                  <span className="text-brand-green font-bold truncate max-w-[80px] sm:max-w-[140px] shrink-0">
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
