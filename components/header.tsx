"use client";

import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import SearchOverlay from "@/components/search/search-overlay";
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
  const [isScrolled, setIsScrolled] = useState(false);

  // Scroll handler
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
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
          "fixed top-0 right-0 z-[90] h-16 sm:h-20 flex items-center transition-all duration-500 select-none",
          "left-0 lg:left-[200px]", // Aligns next to Left Sidebar
          isScrolled
            ? "bg-[#0a0f16]/95 backdrop-blur-2xl border-b border-white/5 shadow-2xl"
            : "bg-gradient-to-b from-black/90 via-black/40 to-transparent"
        )}
      >
        <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 flex items-center justify-end h-full">
          {/* Right: Search Input Trigger Button */}
          <button
            onClick={() => setShowSearchOverlay(true)}
            className="relative flex items-center justify-between w-40 sm:w-60 md:w-72 h-10 sm:h-11 px-4 rounded-full bg-[#141414]/90 backdrop-blur-md hover:bg-white/10 border border-white/10 hover:border-white/25 text-white/70 hover:text-white transition-all duration-300 text-xs sm:text-sm group active:scale-95 shadow-inner shrink-0"
          >
            <div className="flex items-center gap-2.5 truncate">
              <Search className="w-4 h-4 text-white/50 group-hover:text-brand-green transition-colors shrink-0" />
              <span className="truncate text-white/60 group-hover:text-white font-medium">
                Tìm kiếm phim...
              </span>
            </div>
            <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] text-white/50 font-mono font-bold uppercase group-hover:text-brand-green transition-all shrink-0">
              <span className="text-[10px]">Ctrl</span>K
            </kbd>
          </button>
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

