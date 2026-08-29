"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Search, Globe, ChevronDown, Heart, Clock, SlidersHorizontal, BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { sortCountriesByPopularity } from "@/lib/countries";
import SearchOverlay from "@/components/search/search-overlay";

import { preconnect } from "react-dom";

interface HeaderProps {
  categories?: { slug: string; name: string }[];
  countries?: { slug: string; name: string }[];
  topics?: { slug: string; name: string }[];
}

export default function Header({
  categories: propCategories = [],
  countries: propCountries = [],
}: HeaderProps) {
  useEffect(() => {
    preconnect("https://phimapi.com", { crossOrigin: "anonymous" });
    preconnect("https://img.phimapi.com", { crossOrigin: "anonymous" });
    preconnect("https://phimimg.com", { crossOrigin: "anonymous" });
  }, []);
  const pathname = usePathname();
  const router = useRouter();
  const [showSearchOverlay, setShowSearchOverlay] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<"categories" | "countries" | null>(null);
  const dropdownTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [categories, setCategories] = useState<{ slug: string; name: string }[]>(() => {
    if (Array.isArray(propCategories) && propCategories.length > 0) return propCategories;
    const items = (propCategories as any)?.items || (propCategories as any)?.data;
    return Array.isArray(items) ? items : [];
  });

  const [countries, setCountries] = useState<{ slug: string; name: string }[]>(() => {
    if (Array.isArray(propCountries) && propCountries.length > 0) return propCountries;
    const items = (propCountries as any)?.items || (propCountries as any)?.data;
    return Array.isArray(items) ? items : [];
  });

  // Client-side fallback fetch if props were empty
  useEffect(() => {
    if (categories.length === 0 || countries.length === 0) {
      import("@/libs/phimapi.com").then(({ default: PhimApi }) => {
        const api = new PhimApi();
        if (categories.length === 0) {
          api.listCategories().then((res) => {
            if (Array.isArray(res) && res.length > 0) setCategories(res);
          }).catch(() => {});
        }
        if (countries.length === 0) {
          api.listCountries().then((res) => {
            if (Array.isArray(res) && res.length > 0) setCountries(res);
          }).catch(() => {});
        }
      });
    }
  }, [categories.length, countries.length]);

  // Scroll handler
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Auto-close dropdown on route change
  useEffect(() => {
    setActiveDropdown(null);
  }, [pathname]);

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

  const openDropdown = (type: "categories" | "countries") => {
    if (dropdownTimer.current) clearTimeout(dropdownTimer.current);
    setActiveDropdown(type);
  };

  const closeDropdown = () => {
    dropdownTimer.current = setTimeout(() => setActiveDropdown(null), 150);
  };

  return (
    <>
      <header
        className={cn(
          "fixed top-0 right-0 z-[90] h-20 flex items-center transition-all duration-500 select-none",
          "left-0 lg:left-[200px]", // Aligns next to Left Sidebar
          isScrolled
            ? "bg-[#0a0f16]/95 backdrop-blur-3xl border-b border-white/5 shadow-2xl"
            : "bg-gradient-to-b from-black/90 via-black/50 to-transparent"
        )}
      >
        <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 flex items-center justify-between h-full gap-4">
          
          {/* Left: Filter dropdowns */}
          <div className="flex items-center gap-2 sm:gap-3 pl-16 lg:pl-0">
              {/* Category Dropdown Trigger */}
              <div
                className="static sm:relative"
                onMouseEnter={() => openDropdown("categories")}
                onMouseLeave={closeDropdown}
              >
                <button
                  onClick={() => setActiveDropdown((prev) => (prev === "categories" ? null : "categories"))}
                  className={cn(
                    "px-3 sm:px-5 h-10 sm:h-11 rounded-full text-[11px] sm:text-xs font-bold transition-all duration-300 flex items-center justify-center gap-1.5 bg-[#141414]/90 backdrop-blur-md border shadow-inner",
                    activeDropdown === "categories"
                      ? "bg-brand-green/20 text-brand-green border-brand-green/30 shadow-[0_0_20px_rgba(34,197,94,0.2)]"
                      : "border-white/5 hover:border-white/20 hover:bg-white/10 text-white/70 hover:text-white"
                  )}
                >
                  <span>Thể Loại</span>
                  <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-300", activeDropdown === "categories" && "rotate-180 text-brand-green")} />
                </button>

                {/* Categories Mega Dropdown */}
                {activeDropdown === "categories" && categories.length > 0 && (
                  <div
                    className="absolute top-full left-4 right-4 sm:left-0 sm:right-auto mt-4 sm:w-[560px] rounded-3xl bg-[#0a0f16]/95 backdrop-blur-3xl border border-white/10 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.9)] p-5 sm:p-7 animate-fade-in z-50 overflow-hidden"
                    onMouseEnter={() => { if (dropdownTimer.current) clearTimeout(dropdownTimer.current); }}
                    onMouseLeave={closeDropdown}
                  >
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-brand-green/20 rounded-full blur-[80px] pointer-events-none" />
                    
                    <div className="relative z-10 flex items-center justify-between pb-4 mb-4 border-b border-white/10">
                      <span className="text-xs font-bold text-white tracking-widest uppercase flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-brand-green animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                        Tất Cả Thể Loại
                      </span>
                      <span className="text-[10px] font-semibold text-brand-green bg-brand-green/10 px-2 py-0.5 rounded-full border border-brand-green/20">
                        {categories.length} THỂ LOẠI
                      </span>
                    </div>
                    
                    <div className="relative z-10 grid grid-cols-2 sm:grid-cols-3 gap-x-2 sm:gap-x-4 gap-y-2 max-h-[60vh] sm:max-h-[340px] overflow-y-auto scrollbar-hide sm:custom-scrollbar sm:pr-2">
                      {categories.map((cat) => (
                        <Link
                          key={cat.slug}
                          href={`/?category=${cat.slug}`}
                          onClick={() => setActiveDropdown(null)}
                          className="py-2 text-xs font-medium text-white/60 hover:text-white transition-all flex items-center gap-2.5 group relative"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-white/10 group-hover:bg-brand-green group-hover:shadow-[0_0_8px_rgba(34,197,94,0.8)] transition-all duration-300" />
                          <span className="truncate group-hover:translate-x-1 transition-transform duration-300">{cat.name}</span>
                          <div className="absolute left-0 -bottom-0 w-0 h-[1px] bg-gradient-to-r from-brand-green/50 to-transparent group-hover:w-1/2 transition-all duration-500 opacity-0 group-hover:opacity-100" />
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Country Dropdown Trigger */}
              <div
                className="static sm:relative"
                onMouseEnter={() => openDropdown("countries")}
                onMouseLeave={closeDropdown}
              >
                <button
                  onClick={() => setActiveDropdown((prev) => (prev === "countries" ? null : "countries"))}
                  className={cn(
                    "px-3 sm:px-5 h-10 sm:h-11 rounded-full text-[11px] sm:text-xs font-bold transition-all duration-300 flex items-center justify-center gap-1.5 bg-[#141414]/90 backdrop-blur-md border shadow-inner",
                    activeDropdown === "countries"
                      ? "bg-brand-green/20 text-brand-green border-brand-green/30 shadow-[0_0_20px_rgba(34,197,94,0.2)]"
                      : "border-white/5 hover:border-white/20 hover:bg-white/10 text-white/70 hover:text-white"
                  )}
                >
                  <Globe className="w-3.5 h-3.5 text-current opacity-70 hidden sm:block" />
                  <span>Quốc Gia</span>
                  <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-300", activeDropdown === "countries" && "rotate-180 text-brand-green")} />
                </button>

                {/* Country Mega Dropdown */}
                {activeDropdown === "countries" && (
                  <div
                    className="absolute top-full left-4 right-4 sm:left-0 sm:right-auto mt-4 sm:w-[560px] rounded-3xl bg-[#0a0f16]/95 backdrop-blur-3xl border border-white/10 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.9)] p-5 sm:p-7 animate-fade-in z-50 overflow-hidden"
                    onMouseEnter={() => { if (dropdownTimer.current) clearTimeout(dropdownTimer.current); }}
                    onMouseLeave={closeDropdown}
                  >
                    <div className="absolute -top-24 -left-24 w-48 h-48 bg-brand-green/15 rounded-full blur-[80px] pointer-events-none" />

                    <div className="relative z-10 flex items-center justify-between pb-4 mb-5 border-b border-white/10">
                      <span className="text-xs font-bold text-white tracking-widest uppercase flex items-center gap-2">
                        <Globe className="w-4 h-4 text-brand-green" />
                        Quốc Gia Điện Ảnh
                      </span>
                      <span className="text-[10px] font-semibold text-brand-green bg-brand-green/10 px-2 py-0.5 rounded-full border border-brand-green/20">
                        TOÀN THẾ GIỚI
                      </span>
                    </div>

                    <div className="relative z-10 mb-6">
                      <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-3 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-green" /> Nổi Bật
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {sortCountriesByPopularity(countries).slice(0, 8).map((c) => (
                          <Link
                            key={c.slug}
                            href={`/?country=${c.slug}`}
                            onClick={() => setActiveDropdown(null)}
                            className="px-2.5 py-2 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-brand-green/40 rounded-xl transition-all flex flex-col items-center justify-center gap-1.5 text-center group"
                          >
                            {(!c.code || c.code === "WW") ? (
                              <Globe className="w-5 h-5 text-brand-green group-hover:scale-110 transition-transform duration-300" />
                            ) : (
                              <img src={`https://flagcdn.com/w40/${c.code.toLowerCase()}.png`} alt={c.name} className="w-6 h-4 object-cover rounded-[3px] shadow-sm shadow-black/50 group-hover:scale-110 transition-transform duration-300" />
                            )}
                            <span className="text-xs font-semibold text-white/70 group-hover:text-white truncate w-full">{c.name}</span>
                          </Link>
                        ))}
                      </div>
                    </div>

                    <div className="relative z-10">
                      <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-3 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/30" /> Tất Cả
                      </span>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-x-2 gap-y-1 max-h-[60vh] sm:max-h-[180px] overflow-y-auto scrollbar-hide sm:custom-scrollbar sm:pr-2">
                        {sortCountriesByPopularity(countries).map((c) => (
                          <Link
                            key={c.slug}
                            href={`/?country=${c.slug}`}
                            onClick={() => setActiveDropdown(null)}
                            className="px-2 py-1.5 text-xs text-white/50 hover:text-white transition-all flex items-center gap-2 truncate group rounded-lg hover:bg-white/5"
                          >
                            {(!c.code || c.code === "WW") ? (
                              <Globe className="w-4 h-4 text-white/40 group-hover:text-brand-green shrink-0 transition-colors" />
                            ) : (
                              <img src={`https://flagcdn.com/w40/${c.code.toLowerCase()}.png`} alt={c.name} className="w-4 h-3 object-cover rounded-[2px] opacity-70 group-hover:opacity-100 shrink-0 transition-opacity" />
                            )}
                            <span className="truncate group-hover:translate-x-0.5 transition-transform">{c.name}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>


          </div>

          {/* Right: Search & Profile */}
          <div className="flex items-center gap-3 sm:gap-4">

            {/* Search Input Trigger Button (aitmpl.com style) */}
            <button
              onClick={() => setShowSearchOverlay(true)}
              className="flex items-center justify-center w-10 h-10 sm:h-11 sm:w-auto gap-2 sm:gap-3 sm:px-5 rounded-full bg-[#141414]/90 backdrop-blur-md hover:bg-white/10 border border-white/10 hover:border-brand-green/40 text-white/60 hover:text-white transition-all duration-300 text-xs sm:text-sm group shadow-inner shrink-0"
            >
              <Search className="w-4 h-4 text-white/60 group-hover:text-brand-green transition-colors" />
              <span className="hidden sm:inline font-semibold tracking-wide">Tìm kiếm phim...</span>
              <kbd className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/10 border border-white/15 text-[10px] text-white/80 font-mono font-bold tracking-wider uppercase shadow-inner group-hover:text-brand-green transition-colors">
                <span className="text-[11px]">⌘</span>K
              </kbd>
            </button>

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
