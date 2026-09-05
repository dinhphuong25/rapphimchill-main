"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import {
  Home,
  Tv,
  Film,
  Clapperboard,
  Flame,
  Clock,
  Heart,
  Cat,
  Globe,
  X,
  Menu,
  Sparkles,
  ChevronDown,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { sortCountriesByPopularity, getCountryCode } from "@/lib/countries";

interface SidebarProps {
  categories?: { slug: string; name: string }[];
  countries?: { slug: string; name: string }[];
  isTheatreMode?: boolean;
}

const NAV_MAIN = [
  { href: "/", label: "Trang Chủ", icon: Home },
  { href: "/?typeList=phim-chieu-rap", label: "Chiếu Rạp", icon: Clapperboard, typeList: "phim-chieu-rap" },
  { href: "/?typeList=phim-bo", label: "Phim Bộ", icon: Tv, typeList: "phim-bo" },
  { href: "/?typeList=phim-le", label: "Phim Lẻ", icon: Film, typeList: "phim-le" },
  { href: "/?typeList=hoat-hinh", label: "Hoạt Hình", icon: Cat, typeList: "hoat-hinh" },
  { href: "/new-updates", label: "Mới Cập Nhật", icon: Flame },
];

const NAV_PERSONAL = [
  { href: "/recently", label: "Lịch Sử Xem", icon: Clock },
  { href: "/favorites", label: "Phim Yêu Thích", icon: Heart },
];

export default function Sidebar({
  categories: propCategories = [],
  countries: propCountries = [],
  isTheatreMode = false,
}: SidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Section toggle state
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(true);
  const [isCountriesOpen, setIsCountriesOpen] = useState(true);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [showAllCountries, setShowAllCountries] = useState(false);

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

  // Close mobile drawer on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname, searchParams]);

  const currentCategory = searchParams.get("category");
  const currentCountry = searchParams.get("country");
  const currentTypeList = searchParams.get("typeList");

  // Auto expand sections if active item is inside them
  useEffect(() => {
    if (currentCategory) {
      setIsCategoriesOpen(true);
      setShowAllCategories(true);
    }
    if (currentCountry) {
      setIsCountriesOpen(true);
      setShowAllCountries(true);
    }
  }, [currentCategory, currentCountry]);

  const isLinkActive = (href: string, typeList?: string) => {
    if (typeList) {
      return pathname === "/" && currentTypeList === typeList;
    }
    if (href === "/") {
      return pathname === "/" && !currentTypeList && !currentCountry && !currentCategory;
    }
    return pathname.startsWith(href);
  };

  const isCategoryActive = (slug: string) => {
    return pathname === "/" && currentCategory === slug;
  };

  const isCountryActive = (slug: string) => {
    return pathname === "/" && currentCountry === slug;
  };

  const sortedCountries = useMemo(() => {
    return sortCountriesByPopularity(countries);
  }, [countries]);

  const visibleCategories = showAllCategories ? categories : categories.slice(0, 8);
  const visibleCountries = showAllCountries ? sortedCountries : sortedCountries.slice(0, 8);

  // If in Theatre Mode during video watching, auto-hide sidebar
  if (isTheatreMode) return null;

  return (
    <>
      {/* Mobile Drawer Trigger (Only visible on small screens) */}
      <button
        onClick={() => setIsMobileOpen(true)}
        aria-label="Mở Menu"
        className="lg:hidden fixed top-5 left-4 z-[110] w-10 h-10 flex items-center justify-center rounded-full bg-[#141414]/90 border border-white/10 text-white/80 hover:text-white backdrop-blur-xl shadow-lg transition-transform active:scale-95"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-[120] bg-black/80 backdrop-blur-sm animate-fade-in"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Desktop & Mobile Sidebar Container */}
      <aside
        className={cn(
          "fixed top-0 left-0 bottom-0 z-[100] bg-cinema-sub border-r border-white/10 text-cinema-text flex flex-col transition-all duration-300 ease-out select-none",
          // Mobile state
          isMobileOpen ? "translate-x-0 w-[260px] z-[130]" : "-translate-x-full lg:translate-x-0",
          // Desktop sizing
          "lg:w-[200px]"
        )}
      >
        {/* Sidebar Header / Logo */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-white/8 shrink-0">
          <Link href="/" className="flex items-center gap-2.5 overflow-hidden group py-1">
            <Image
              src="/favicon.svg"
              alt="Hi Phim Logo"
              width={34}
              height={34}
              className="w-8.5 h-8.5 object-contain transition-transform group-hover:scale-105"
              priority
            />
            <div className="flex items-center tracking-tight leading-none">
              <span className="text-base font-black text-white font-sans tracking-wide">HI</span>
              <span className="text-base font-black text-brand-green font-sans ml-1 tracking-wide">PHIM</span>
            </div>
          </Link>

          {/* Close Button — Mobile */}
          <button
            onClick={() => setIsMobileOpen(false)}
            aria-label="Đóng Menu"
            className="lg:hidden p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Navigation Body */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-5 scrollbar-thin scrollbar-thumb-white/10 hover:scrollbar-thumb-white/20">
          
          {/* Main Nav Section */}
          <div className="space-y-1">
            <span className="px-3 text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-2">
              MENU CHÍNH
            </span>

            {NAV_MAIN.map((item) => {
              const active = isLinkActive(item.href, item.typeList);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 group overflow-hidden",
                    active
                      ? "bg-gradient-to-r from-brand-green/20 via-brand-green/10 to-transparent text-brand-green font-bold shadow-[inset_0_1px_0_rgba(34,197,94,0.2)]"
                      : "text-white/60 hover:text-white hover:bg-white/5"
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  {active && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-brand-green rounded-r-full shadow-[0_0_12px_rgba(34,197,94,0.8)]" />
                  )}
                  <Icon className={cn("w-4 h-4 shrink-0 transition-transform group-hover:scale-110", active ? "text-brand-green" : "text-white/60 group-hover:text-white")} />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="h-[1px] bg-white/5 mx-2" />

          {/* Categories Section (Thể Loại) */}
          <div className="space-y-1">
            <button
              onClick={() => setIsCategoriesOpen((prev) => !prev)}
              className="w-full flex items-center justify-between px-3 py-1.5 text-[10px] font-bold text-white/50 hover:text-white uppercase tracking-widest transition-colors group"
            >
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-brand-green/80" />
                THỂ LOẠI
              </span>
              <div className="flex items-center gap-1">
                {categories.length > 0 && (
                  <span className="text-[9px] px-1.5 py-0.2 bg-white/5 text-white/40 rounded-full font-mono">
                    {categories.length}
                  </span>
                )}
                <ChevronDown
                  className={cn(
                    "w-3 h-3 transition-transform duration-200 text-white/40 group-hover:text-white",
                    isCategoriesOpen ? "rotate-0" : "-rotate-90"
                  )}
                />
              </div>
            </button>

            {isCategoriesOpen && (
              <div className="space-y-0.5 pt-1 animate-in fade-in duration-200">
                {visibleCategories.map((cat) => {
                  const active = isCategoryActive(cat.slug);
                  return (
                    <Link
                      key={cat.slug}
                      href={`/?category=${cat.slug}`}
                      className={cn(
                        "relative flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-200 group",
                        active
                          ? "bg-brand-green/15 text-brand-green font-bold shadow-[inset_0_1px_0_rgba(34,197,94,0.2)]"
                          : "text-white/55 hover:text-white hover:bg-white/5"
                      )}
                    >
                      <span
                        className={cn(
                          "w-1.5 h-1.5 rounded-full transition-all duration-300",
                          active
                            ? "bg-brand-green shadow-[0_0_8px_rgba(34,197,94,0.9)] scale-125"
                            : "bg-white/20 group-hover:bg-white/60"
                        )}
                      />
                      <span className="truncate">{cat.name}</span>
                    </Link>
                  );
                })}

                {categories.length > 8 && (
                  <button
                    onClick={() => setShowAllCategories((prev) => !prev)}
                    className="w-full text-left px-3 py-1.5 text-[10px] font-semibold text-brand-green hover:text-brand-green/80 transition-colors flex items-center gap-1 mt-1"
                  >
                    <span>{showAllCategories ? "Thu gọn" : `+ Xem thêm (${categories.length - 8})`}</span>
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="h-[1px] bg-white/5 mx-2" />

          {/* Countries Section (Quốc Gia) */}
          <div className="space-y-1">
            <button
              onClick={() => setIsCountriesOpen((prev) => !prev)}
              className="w-full flex items-center justify-between px-3 py-1.5 text-[10px] font-bold text-white/50 hover:text-white uppercase tracking-widest transition-colors group"
            >
              <span className="flex items-center gap-1.5">
                <Globe className="w-3 h-3 text-brand-green/80" />
                QUỐC GIA
              </span>
              <div className="flex items-center gap-1">
                {countries.length > 0 && (
                  <span className="text-[9px] px-1.5 py-0.2 bg-white/5 text-white/40 rounded-full font-mono">
                    {countries.length}
                  </span>
                )}
                <ChevronDown
                  className={cn(
                    "w-3 h-3 transition-transform duration-200 text-white/40 group-hover:text-white",
                    isCountriesOpen ? "rotate-0" : "-rotate-90"
                  )}
                />
              </div>
            </button>

            {isCountriesOpen && (
              <div className="space-y-0.5 pt-1 animate-in fade-in duration-200">
                {visibleCountries.map((c) => {
                  const active = isCountryActive(c.slug);
                  const code = c.code || getCountryCode(c.slug);
                  return (
                    <Link
                      key={c.slug}
                      href={`/?country=${c.slug}`}
                      className={cn(
                        "relative flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-200 group",
                        active
                          ? "bg-brand-green/15 text-brand-green font-bold shadow-[inset_0_1px_0_rgba(34,197,94,0.2)]"
                          : "text-white/55 hover:text-white hover:bg-white/5"
                      )}
                    >
                      <span
                        className={cn(
                          "w-5 text-[9px] font-mono font-bold uppercase rounded text-center shrink-0 py-0.2",
                          active
                            ? "bg-brand-green/20 text-brand-green border border-brand-green/30"
                            : "bg-white/5 text-white/40 group-hover:text-white group-hover:bg-white/10"
                        )}
                      >
                        {code}
                      </span>
                      <span className="truncate">{c.name}</span>
                    </Link>
                  );
                })}

                {sortedCountries.length > 8 && (
                  <button
                    onClick={() => setShowAllCountries((prev) => !prev)}
                    className="w-full text-left px-3 py-1.5 text-[10px] font-semibold text-brand-green hover:text-brand-green/80 transition-colors flex items-center gap-1 mt-1"
                  >
                    <span>{showAllCountries ? "Thu gọn" : `+ Xem thêm (${sortedCountries.length - 8})`}</span>
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="h-[1px] bg-white/5 mx-2" />

          {/* Personal Group Section */}
          <div className="space-y-1">
            <span className="px-3 text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-2">
              CÁ NHÂN
            </span>

            {NAV_PERSONAL.map((item) => {
              const active = isLinkActive(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 group overflow-hidden",
                    active
                      ? "bg-gradient-to-r from-brand-green/20 via-brand-green/10 to-transparent text-brand-green font-bold shadow-[inset_0_1px_0_rgba(34,197,94,0.2)]"
                      : "text-white/60 hover:text-white hover:bg-white/5"
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  {active && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-brand-green rounded-r-full shadow-[0_0_12px_rgba(34,197,94,0.8)]" />
                  )}
                  <Icon className={cn("w-4 h-4 shrink-0 transition-transform group-hover:scale-110", active ? "text-brand-green" : "text-white/60 group-hover:text-white")} />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>

        </div>

        {/* Sidebar Footer */}
        <div className="p-2.5 border-t border-white/8 shrink-0 text-center bg-black/20">
          <div className="text-[10px] text-white/30 truncate">
            © 2026 HI PHIM
          </div>
        </div>
      </aside>
    </>
  );
}
