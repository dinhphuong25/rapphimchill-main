"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import SearchOverlay from "@/components/search/search-overlay";
import UserMenu from "@/components/auth/user-menu";
import { preconnect } from "react-dom";

interface HeaderProps {
  categories?: { slug: string; name: string }[];
  countries?: { slug: string; name: string }[];
  topics?: { slug: string; name: string }[];
}

export default function Header({}: HeaderProps) {
  useEffect(() => {
    preconnect("https://phimapi.com", { crossOrigin: "anonymous" });
    preconnect("https://img.phimapi.com", { crossOrigin: "anonymous" });
    preconnect("https://phimimg.com", { crossOrigin: "anonymous" });
  }, []);

  const [showSearchOverlay, setShowSearchOverlay] = useState(false);

  // Hotkey '/' or 'Ctrl+K' to open search overlay
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" || (e.ctrlKey && e.key === "k")) {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA") return;
        e.preventDefault();
        setShowSearchOverlay(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <header
        className={cn(
          "fixed top-0 right-0 z-[90] h-16 sm:h-20 flex items-center transition-all duration-300 select-none pointer-events-none bg-transparent transform-gpu",
          "left-0 lg:left-[225px]" // Aligns next to Left Sidebar
        )}
      >
        <div className="w-full max-w-[1600px] mx-auto px-3 sm:px-8 lg:px-12 xl:px-16 flex items-center justify-between lg:justify-end h-full">
          {/* Mobile Brand Name on Left (Only visible on mobile screens) */}
          <Link
            href="/"
            className="lg:hidden pointer-events-auto flex items-center py-1 select-none group shrink-0"
            aria-label="Về trang chủ Hi Phim"
          >
            <div className="relative w-24 sm:w-28 h-7 sm:h-8 select-none transition-transform group-hover:scale-105">
              <Image
                src="/logo.png"
                alt="Hi Phim"
                fill
                priority
                className="object-contain object-left drop-shadow-[0_0_12px_rgba(32,214,107,0.35)]"
                sizes="120px"
              />
            </div>
          </Link>

          {/* Right Action Cluster: Search bar + User Profile / Login */}
          <div className="flex items-center gap-2 sm:gap-3 pointer-events-auto">
            {/* Search Trigger Button */}
            <button
              onClick={() => setShowSearchOverlay(true)}
              className="relative flex items-center justify-between w-36 xs:w-48 sm:w-56 md:w-64 h-9 sm:h-11 pl-2.5 sm:pl-2.5 pr-2.5 sm:pr-3.5 rounded-full bg-[#0d1410]/95 hover:bg-[#121c17] border border-brand-green/35 hover:border-brand-green/80 backdrop-blur-xl text-white transition-all duration-300 cursor-pointer group shadow-[0_4px_24px_rgba(0,0,0,0.7),0_0_15px_rgba(32,214,107,0.18)] hover:shadow-[0_0_30px_rgba(32,214,107,0.4)] active:scale-95 shrink-0 overflow-hidden"
              aria-label="Tìm kiếm phim"
            >
              {/* Subtle Ambient Hover Glow */}
              <div className="absolute inset-0 bg-gradient-to-r from-brand-green/10 via-transparent to-brand-green/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

              <div className="flex items-center gap-1.5 sm:gap-2.5 z-10 min-w-0">
                {/* Glowing Search Icon Badge */}
                <div className="w-5 h-5 sm:w-7 sm:h-7 rounded-full bg-brand-green/15 border border-brand-green/35 flex items-center justify-center text-brand-green shrink-0 group-hover:bg-brand-green group-hover:text-black group-hover:shadow-[0_0_12px_rgba(32,214,107,0.6)] transition-all duration-200">
                  <Search className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" />
                </div>
                <span className="text-white/85 group-hover:text-white font-medium text-xs sm:text-[13px] whitespace-nowrap">
                  <span className="xs:hidden">Tìm kiếm</span>
                  <span className="hidden xs:inline">Tìm kiếm phim</span>
                </span>
              </div>

              <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-brand-green/10 border border-brand-green/30 text-[10px] text-brand-green font-mono font-bold uppercase shadow-[0_0_8px_rgba(32,214,107,0.15)] group-hover:bg-brand-green/20 group-hover:border-brand-green/60 transition-all shrink-0 z-10">
                <span className="text-[10px]">Ctrl</span>K
              </kbd>
            </button>

            {/* User Profile / Admin Control */}
            <div className="flex items-center shrink-0">
              <UserMenu />
            </div>
          </div>
        </div>
      </header>

      {/* Fullscreen Search Overlay */}
      <SearchOverlay
        isOpen={showSearchOverlay}
        onClose={() => setShowSearchOverlay(false)}
      />
    </>
  );
}

