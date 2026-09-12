"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  const pathname = usePathname();
  const hideHeader =
    pathname === "/recently" ||
    pathname === "/favorites" ||
    pathname?.startsWith("/recently") ||
    pathname?.startsWith("/favorites");

  useEffect(() => {
    preconnect("https://phimapi.com", { crossOrigin: "anonymous" });
    preconnect("https://img.phimapi.com", { crossOrigin: "anonymous" });
    preconnect("https://phimimg.com", { crossOrigin: "anonymous" });
  }, []);

  const [showSearchOverlay, setShowSearchOverlay] = useState(false);

  // Hotkey '/' or 'Ctrl+K' to open search overlay
  useEffect(() => {
    if (hideHeader) return;
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
  }, [hideHeader]);

  return (
    <>
      {!hideHeader && (
        <header
          className={cn(
            "fixed top-0 right-0 z-[90] h-16 sm:h-20 flex items-center transition-all duration-300 select-none pointer-events-none bg-transparent transform-gpu",
            "left-0 lg:left-[225px]" // Aligns next to Left Sidebar
          )}
        >
          <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 flex items-center justify-between lg:justify-end h-full">
            {/* Mobile Brand Name on Left (Only visible on mobile screens) */}
            <Link
              href="/"
              className="lg:hidden pointer-events-auto flex items-center py-1 select-none group"
              aria-label="Về trang chủ Hi Phim"
            >
              <div className="flex items-center tracking-tight leading-none group-hover:opacity-90 transition-opacity">
                <span className="text-lg sm:text-xl font-black text-white font-sans tracking-wide">Hi</span>
                <span className="text-lg sm:text-xl font-black text-brand-green font-sans ml-1 tracking-wide">Phim</span>
                <span className="text-[9px] sm:text-[10px] font-black text-brand-green self-start -mt-0.5 ml-0.5 select-none">®</span>
              </div>
            </Link>

            {/* Right: Search Input Trigger Button */}
            <button
              onClick={() => setShowSearchOverlay(true)}
              className="pointer-events-auto relative flex items-center justify-between w-36 sm:w-60 md:w-72 h-10 sm:h-11 px-3 sm:px-4 rounded-full bg-[#111714]/80 backdrop-blur-md hover:bg-white/[0.08] border border-white/10 hover:border-brand-green/40 hover:shadow-[0_0_20px_rgba(32,214,107,0.2)] text-white/70 hover:text-white transition-all duration-300 text-xs sm:text-sm group active:scale-95 shrink-0"
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
      )}

      {/* Fullscreen Search Overlay */}
      <SearchOverlay
        isOpen={showSearchOverlay}
        onClose={() => setShowSearchOverlay(false)}
      />
    </>
  );
}

