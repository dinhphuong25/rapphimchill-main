"use client";

import { useState, useEffect, memo } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Search, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";
import SearchOverlay from "@/components/search/search-overlay";
import UserMenu from "@/components/auth/user-menu";
import BrandLogo from "@/components/ui/brand-logo";
import { preconnect } from "react-dom";

interface HeaderProps {
  categories?: { slug: string; name: string }[];
  countries?: { slug: string; name: string }[];
  topics?: { slug: string; name: string }[];
}

function HeaderComponent({}: HeaderProps) {
  useEffect(() => {
    preconnect("https://phimapi.com", { crossOrigin: "anonymous" });
    preconnect("https://img.phimapi.com", { crossOrigin: "anonymous" });
    preconnect("https://phimimg.com", { crossOrigin: "anonymous" });
  }, []);

  const [showSearchOverlay, setShowSearchOverlay] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Synchronize state with MobileExploreSheet
  useEffect(() => {
    const handleState = (e: Event) => {
      const customEvent = e as CustomEvent<{ isOpen: boolean }>;
      if (customEvent.detail && typeof customEvent.detail.isOpen === "boolean") {
        setIsMenuOpen(customEvent.detail.isOpen);
      }
    };
    window.addEventListener("mobile-explore-state", handleState);
    return () => window.removeEventListener("mobile-explore-state", handleState);
  }, []);

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
          "fixed top-0 right-0 z-[90] h-16 flex items-center transition-all duration-300 select-none bg-cinema-sub border-b border-white/10 shadow-none",
          "left-0 lg:left-[225px]"
        )}
      >
        <div className="w-full max-w-[1700px] mx-auto px-2.5 sm:px-6 lg:px-8 flex items-center justify-between h-full min-w-0">
          {/* Left Group: Mobile Menu Button [⊞ Menu] + Brand Logo (Desktop & Mobile) */}
          <div className="flex items-center gap-2 sm:gap-2.5 pointer-events-auto shrink min-w-0">
            <button
              type="button"
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.dispatchEvent(new CustomEvent("toggle-mobile-explore"));
                }
              }}
              aria-expanded={isMenuOpen}
              aria-controls="mobile-explore-sheet"
              aria-haspopup="dialog"
              aria-label={isMenuOpen ? "Đóng menu khám phá" : "Mở menu khám phá"}
              title="Menu khám phá"
              className={cn(
                "lg:hidden relative flex items-center gap-1.5 h-9 px-2.5 sm:px-3 rounded-xl border transition-all duration-200 cursor-pointer group shrink-0 select-none touch-manipulation overflow-hidden",
                // Expanded touch target area (WCAG 44x44px minimum for effortless mobile tapping)
                "before:absolute before:-inset-2 before:content-[''] before:z-0",
                // Active / Open State vs Default State
                isMenuOpen
                  ? "bg-[#14231b] border-brand-green shadow-[0_0_16px_rgba(32,214,107,0.35)]"
                  : "bg-[#111714] hover:bg-[#151D19] border-white/10 hover:border-brand-green/50 active:border-brand-green/60 shadow-[0_2px_10px_rgba(0,0,0,0.5)]",
                "active:scale-95"
              )}
            >
              {/* Ambient Glow */}
              <div
                className={cn(
                  "absolute inset-0 bg-gradient-to-r from-brand-green/15 via-transparent to-brand-green/10 transition-opacity pointer-events-none rounded-xl",
                  isMenuOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                )}
              />

              {/* 4-square Grid Icon — Hi Phim Emerald */}
              <LayoutGrid
                className={cn(
                  "w-4 h-4 text-brand-green transition-all duration-200 shrink-0 relative z-10",
                  isMenuOpen
                    ? "scale-110 drop-shadow-[0_0_8px_rgba(32,214,107,0.9)]"
                    : "group-hover:scale-105"
                )}
              />

              {/* Menu Text */}
              <span
                className={cn(
                  "text-[12px] sm:text-[12.5px] tracking-wide leading-none select-none relative z-10 transition-colors",
                  isMenuOpen
                    ? "text-brand-green font-bold"
                    : "font-semibold text-white/90 group-hover:text-white"
                )}
              >
                Menu
              </span>
            </button>

            <Link
              href="/"
              className="flex items-center select-none group shrink-0 min-w-0"
              aria-label="Về trang chủ Hi Phim"
            >
              <BrandLogo size="md" />
            </Link>
          </div>

          {/* Right Action Cluster: Search bar + User Profile / Login */}
          <div className="flex items-center gap-2 sm:gap-2.5 pointer-events-auto">
            {/* Search Trigger Button - Full Pill across all viewports, snug on mobile */}
            <button
              onClick={() => setShowSearchOverlay(true)}
              className="relative flex items-center justify-between h-9 sm:h-10 pl-2 pr-3 sm:pr-2.5 w-auto sm:w-44 md:w-48 lg:w-52 rounded-full bg-[#111714] hover:bg-[#151D19] border border-white/10 hover:border-brand-green/50 backdrop-blur-xl text-white transition-all duration-300 cursor-pointer group shadow-[0_4px_24px_rgba(0,0,0,0.7)] active:scale-95 shrink-0 overflow-hidden"
              aria-label="Tìm kiếm phim"
            >
              {/* Subtle Ambient Hover Glow */}
              <div className="absolute inset-0 bg-gradient-to-r from-brand-green/10 via-transparent to-brand-green/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

              {/* Search Pill Content */}
              <div className="flex items-center gap-1.5 sm:gap-2 z-10 min-w-0">
                {/* Glowing Search Icon Badge */}
                <div className="w-5.5 h-5.5 sm:w-6.5 sm:h-6.5 rounded-full bg-brand-green/15 border border-brand-green/35 flex items-center justify-center text-brand-green shrink-0 group-hover:bg-brand-green group-hover:text-black group-hover:shadow-[0_0_12px_rgba(32,214,107,0.6)] transition-all duration-200">
                  <Search className="w-3 h-3" />
                </div>
                <span className="text-white/85 group-hover:text-white font-medium text-[11.5px] sm:text-[12.5px] whitespace-nowrap">
                  Tìm kiếm phim
                </span>
              </div>

              <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-brand-green/10 border border-brand-green/30 text-[9.5px] text-brand-green font-mono font-bold uppercase shadow-[0_0_8px_rgba(32,214,107,0.15)] group-hover:bg-brand-green/20 group-hover:border-brand-green/60 transition-all shrink-0 z-10 ml-2">
                <span className="text-[9.5px]">Ctrl</span>K
              </kbd>
            </button>

            {/* User Profile / Admin Control — Hidden on mobile since it's already in the bottom nav dock */}
            <div className="hidden lg:flex items-center shrink-0">
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

export default memo(HeaderComponent);

