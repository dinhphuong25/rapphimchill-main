"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import {
  Home,
  Tv,
  Film,
  Clapperboard,
  Flame,
  Clock,
  History,
  Heart,
  Cat,
  Globe,
  X,
  Menu,
  Sparkles,
  ChevronRight,
  Layers,
  Search,
  Check,
  Calendar,
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
  { href: "/recently", label: "Lịch Sử Xem", icon: History },
  { href: "/favorites", label: "Phim Yêu Thích", icon: Heart },
];

export default function Sidebar({
  categories: propCategories = [],
  countries: propCountries = [],
  isTheatreMode = false,
}: SidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Active selection modal: 'categories' | 'countries' | 'years' | null
  const [activeModal, setActiveModal] = useState<"categories" | "countries" | "years" | null>(null);
  const [categorySearchQuery, setCategorySearchQuery] = useState("");
  const [countrySearchQuery, setCountrySearchQuery] = useState("");
  const [yearSearchQuery, setYearSearchQuery] = useState("");

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

  // Close modals and mobile drawer on route change
  useEffect(() => {
    setIsMobileOpen(false);
    setActiveModal(null);
    setCategorySearchQuery("");
    setCountrySearchQuery("");
    setYearSearchQuery("");
  }, [pathname, searchParams]);

  // Listen for Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveModal(null);
      }
    };
    if (activeModal) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [activeModal]);

  const currentCategory = searchParams.get("category");
  const currentCountry = searchParams.get("country");
  const currentYear = searchParams.get("year");
  const currentTypeList = searchParams.get("typeList");

  // Find active names
  const activeCategoryObj = useMemo(() => {
    return categories.find((c) => c.slug === currentCategory);
  }, [categories, currentCategory]);

  const activeCountryObj = useMemo(() => {
    return countries.find((c) => c.slug === currentCountry);
  }, [countries, currentCountry]);

  const isLinkActive = (href: string, typeList?: string) => {
    if (typeList) {
      return pathname === "/" && currentTypeList === typeList;
    }
    if (href === "/") {
      return (
        pathname === "/" &&
        !currentTypeList &&
        !currentCountry &&
        !currentCategory &&
        !currentYear
      );
    }
    return pathname.startsWith(href);
  };

  const sortedCountries = useMemo(() => {
    return sortCountriesByPopularity(countries);
  }, [countries]);

  const currentYearNum = new Date().getFullYear();
  const YEARS_LIST = useMemo(() => {
    return Array.from(
      { length: currentYearNum - 1980 + 1 },
      (_, i) => currentYearNum - i
    );
  }, [currentYearNum]);

  const HIGHLIGHT_YEARS = useMemo(() => {
    return YEARS_LIST.slice(0, 8);
  }, [YEARS_LIST]);

  const filteredCategories = useMemo(() => {
    if (!categorySearchQuery.trim()) return categories;
    return categories.filter((c) =>
      c.name.toLowerCase().includes(categorySearchQuery.toLowerCase())
    );
  }, [categories, categorySearchQuery]);

  const filteredCountries = useMemo(() => {
    if (!countrySearchQuery.trim()) return sortedCountries;
    return sortedCountries.filter((c) =>
      c.name.toLowerCase().includes(countrySearchQuery.toLowerCase())
    );
  }, [sortedCountries, countrySearchQuery]);

  const filteredYears = useMemo(() => {
    if (!yearSearchQuery.trim()) return YEARS_LIST;
    return YEARS_LIST.filter((y) => String(y).includes(yearSearchQuery.trim()));
  }, [YEARS_LIST, yearSearchQuery]);

  const handleSelectCategory = (slug: string) => {
    setActiveModal(null);
    setIsMobileOpen(false);
    router.push(`/?category=${slug}`);
  };

  const handleSelectCountry = (slug: string) => {
    setActiveModal(null);
    setIsMobileOpen(false);
    router.push(`/?country=${slug}`);
  };

  const handleSelectYear = (year: number | string) => {
    setActiveModal(null);
    setIsMobileOpen(false);
    router.push(`/?year=${year}`);
  };

  // If in Theatre Mode during video watching, auto-hide sidebar
  if (isTheatreMode) return null;

  return (
    <>
      {/* ======================================================== */}
      {/* MOBILE BOTTOM NAVIGATION BAR (INSTAGRAM FLOATING PILL DOCK) */}
      {/* ======================================================== */}
      <nav
        aria-label="Điều hướng chính"
        className="lg:hidden fixed left-3.5 right-3.5 sm:left-auto sm:right-auto sm:w-[400px] bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-[110] max-w-[420px] mx-auto pointer-events-auto select-none"
        style={{ contain: "layout style", isolation: "isolate" }}
      >
        <div className="h-14 px-1.5 rounded-full bg-[#0B100E] border border-white/10 shadow-[0_4px_24px_rgba(0,0,0,0.7)] flex items-center justify-around">
          {/* Tab 1: Trang Chủ */}
          {(() => {
            const active =
              pathname === "/" &&
              !currentTypeList &&
              !currentCountry &&
              !currentCategory &&
              !currentYear;
            return (
              <Link
                href="/"
                prefetch={true}
                onClick={() => {
                  setIsMobileOpen(false);
                  setActiveModal(null);
                }}
                className={cn(
                  "flex-1 h-10 mx-1 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-colors duration-150 active:scale-[0.94] select-none",
                  active
                    ? "bg-brand-green/15 border border-brand-green/35 text-brand-green font-bold"
                    : "border border-transparent text-white/60"
                )}
                aria-label="Trang Chủ"
              >
                <Home className={cn("w-[18px] h-[18px]", active && "scale-105")} />
                <span className="text-[10px] font-bold tracking-tight whitespace-nowrap">Trang Chủ</span>
              </Link>
            );
          })()}

          {/* Tab 2: Chiếu Rạp */}
          {(() => {
            const active = pathname === "/" && currentTypeList === "phim-chieu-rap";
            return (
              <Link
                href="/?typeList=phim-chieu-rap"
                prefetch={true}
                onClick={() => {
                  setIsMobileOpen(false);
                  setActiveModal(null);
                }}
                className={cn(
                  "flex-1 h-10 mx-1 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-colors duration-150 active:scale-[0.94] select-none",
                  active
                    ? "bg-brand-green/15 border border-brand-green/35 text-brand-green font-bold"
                    : "border border-transparent text-white/60"
                )}
                aria-label="Chiếu Rạp"
              >
                <Clapperboard className={cn("w-[18px] h-[18px]", active && "scale-105")} />
                <span className="text-[10px] font-bold tracking-tight whitespace-nowrap">Chiếu Rạp</span>
              </Link>
            );
          })()}

          {/* Tab 3: Lịch Sử Xem */}
          {(() => {
            const active = pathname === "/recently";
            return (
              <Link
                href="/recently"
                prefetch={true}
                onClick={() => {
                  setIsMobileOpen(false);
                  setActiveModal(null);
                }}
                className={cn(
                  "flex-1 h-10 mx-1 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-colors duration-150 active:scale-[0.94] select-none",
                  active
                    ? "bg-brand-green/15 border border-brand-green/35 text-brand-green font-bold"
                    : "border border-transparent text-white/60"
                )}
                aria-label="Lịch Sử Xem"
              >
                <History className={cn("w-[18px] h-[18px]", active && "scale-105")} />
                <span className="text-[10px] font-bold tracking-tight whitespace-nowrap">Lịch Sử</span>
              </Link>
            );
          })()}

          {/* Tab 4: Yêu Thích */}
          {(() => {
            const active = pathname === "/favorites";
            return (
              <Link
                href="/favorites"
                prefetch={true}
                onClick={() => {
                  setIsMobileOpen(false);
                  setActiveModal(null);
                }}
                className={cn(
                  "flex-1 h-10 mx-1 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-colors duration-150 active:scale-[0.94] select-none",
                  active
                    ? "bg-brand-green/15 border border-brand-green/35 text-brand-green font-bold"
                    : "border border-transparent text-white/60"
                )}
                aria-label="Phim Yêu Thích"
              >
                <Heart className={cn("w-[18px] h-[18px]", active && "scale-105", active && "fill-brand-green")} />
                <span className="text-[10px] font-bold tracking-tight whitespace-nowrap">Yêu Thích</span>
              </Link>
            );
          })()}

          {/* Tab 5: Danh Mục (Mở Drawer đầy đủ Thể loại, Quốc gia, Năm...) */}
          {(() => {
            const active =
              isMobileOpen ||
              Boolean(currentCategory) ||
              Boolean(currentCountry) ||
              Boolean(currentYear) ||
              (Boolean(currentTypeList) && currentTypeList !== "phim-chieu-rap");
            return (
              <button
                onClick={() => {
                  setActiveModal(null);
                  setIsMobileOpen(true);
                }}
                className={cn(
                  "relative flex-1 h-10 mx-1 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-colors duration-150 active:scale-[0.94] select-none",
                  active
                    ? "bg-brand-green/15 border border-brand-green/35 text-brand-green font-bold"
                    : "border border-transparent text-white/60"
                )}
                aria-label="Danh Mục"
              >
                <div className="relative">
                  <Layers className={cn("w-[18px] h-[18px]", active && "scale-105")} />
                  {(currentCategory || currentCountry || currentYear) && (
                    <span className="absolute -top-1 -right-1.5 w-2 h-2 bg-brand-green rounded-full" />
                  )}
                </div>
                <span className="text-[10px] font-bold tracking-tight whitespace-nowrap">Danh Mục</span>
              </button>
            );
          })()}
        </div>
      </nav>

      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-[120] bg-black/75"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Desktop & Mobile Sidebar Container */}
      <aside
        className={cn(
          "fixed top-0 left-0 bottom-0 bg-cinema-sub border-r border-white/10 text-cinema-text flex flex-col transition-transform duration-300 ease-out select-none will-change-transform",
          "w-[280px] lg:w-[225px]",
          // Mobile state
          isMobileOpen ? "translate-x-0 z-[130]" : "-translate-x-full lg:translate-x-0 z-[100]"
        )}
      >
        {/* Sidebar Header / Logo */}
        <div className="h-16 lg:h-12 px-4 flex items-center justify-between border-b border-white/8 shrink-0">
          <Link href="/" className="flex items-center gap-2.5 overflow-hidden group py-1">
            <Image
              src="/favicon.svg"
              alt="Hi Phim Logo"
              width={32}
              height={32}
              className="w-8 h-8 object-contain transition-transform group-hover:scale-105"
              priority
            />
            <div className="flex items-center tracking-tight leading-none">
              <span className="text-base lg:text-lg font-black text-white font-sans tracking-wide">Hi</span>
              <span className="text-base lg:text-lg font-black text-brand-green font-sans ml-1 tracking-wide">Phim</span>
              <span className="text-[8px] lg:text-[9.5px] font-black text-brand-green self-start -mt-0.5 ml-0.5 select-none">®</span>
            </div>
          </Link>

          {/* Close Button — Mobile */}
          <button
            onClick={() => setIsMobileOpen(false)}
            aria-label="Đóng Menu"
            className="lg:hidden p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Navigation Body - Balanced spacing to fit frame seamlessly */}
        <div className="flex-1 overflow-y-auto lg:overflow-y-hidden overflow-x-hidden p-3 lg:p-2 lg:py-2 space-y-3 lg:space-y-1.5 custom-scrollbar">
          
          {/* Main Nav Section */}
          <div className="space-y-1 lg:space-y-1">
            <span className="px-3 lg:px-2 text-[11px] lg:text-[10px] font-extrabold text-white/45 uppercase tracking-wider block mb-1.5 lg:mb-1">
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
                    "relative flex items-center gap-3 lg:gap-2 px-3 lg:px-2 py-2 lg:py-1.5 rounded-xl text-sm lg:text-[13px] font-medium lg:font-semibold transition-colors duration-150 group overflow-hidden",
                    active
                      ? "bg-gradient-to-r from-brand-green/20 via-brand-green/10 to-transparent text-brand-green font-bold shadow-[inset_0_1px_0_rgba(34,197,94,0.2)]"
                      : "text-white/60 hover:text-white hover:bg-white/5"
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  {active && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 lg:h-3.5 bg-brand-green rounded-r-full shadow-[0_0_10px_rgba(34,197,94,0.8)]" />
                  )}
                  <Icon className={cn("w-[18px] h-[18px] lg:w-4 lg:h-4 shrink-0 transition-transform group-hover:scale-110", active ? "text-brand-green" : "text-white/60 group-hover:text-white")} />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Divider 1 */}
          <div className="h-[1px] bg-white/5 mx-2 lg:mx-1 my-1.5 lg:my-1.5" />

          {/* Discovery / Selection Boards Trigger */}
          <div className="space-y-1 lg:space-y-1">
            <span className="px-3 lg:px-2 text-[11px] lg:text-[10px] font-extrabold text-white/45 uppercase tracking-wider block mb-1.5 lg:mb-1">
              KHÁM PHÁ
            </span>

            {/* Thể Loại (Categories Modal Trigger) */}
            <button
              onClick={() => setActiveModal("categories")}
              className={cn(
                "w-full relative flex items-center justify-between px-3 lg:px-2 py-2 lg:py-1.5 rounded-xl text-sm lg:text-[13px] font-medium lg:font-semibold transition-colors duration-150 group text-left",
                currentCategory
                  ? "bg-gradient-to-r from-brand-green/20 via-brand-green/10 to-transparent text-brand-green font-bold shadow-[inset_0_1px_0_rgba(34,197,94,0.2)]"
                  : "text-white/65 hover:text-white hover:bg-white/5"
              )}
            >
              {currentCategory && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 lg:h-3.5 bg-brand-green rounded-r-full shadow-[0_0_10px_rgba(34,197,94,0.8)]" />
              )}
              <div className="flex items-center gap-3 lg:gap-2 min-w-0">
                <Layers className={cn("w-[18px] h-[18px] lg:w-4 lg:h-4 shrink-0 transition-transform group-hover:scale-110", currentCategory ? "text-brand-green" : "text-white/60 group-hover:text-white")} />
                <div className="flex flex-col min-w-0">
                  <span className="truncate">Thể Loại</span>
                  {activeCategoryObj && (
                    <span className="text-xs lg:text-[10px] text-brand-green font-normal truncate">
                      {activeCategoryObj.name}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1.5 lg:gap-1 shrink-0 ml-1">
                <span className="text-[10px] lg:text-[9px] px-2 lg:px-1.5 py-0.5 rounded-full bg-white/5 text-white/50 group-hover:bg-brand-green/20 group-hover:text-brand-green font-mono font-bold">
                  {categories.length || "24"}
                </span>
                <ChevronRight className="w-4 h-4 lg:w-3.5 lg:h-3.5 text-white/40 group-hover:text-white group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>

            {/* Quốc Gia (Countries Modal Trigger) */}
            <button
              onClick={() => setActiveModal("countries")}
              className={cn(
                "w-full relative flex items-center justify-between px-3 lg:px-2 py-2 lg:py-1.5 rounded-xl text-sm lg:text-[13px] font-medium lg:font-semibold transition-colors duration-150 group text-left",
                currentCountry
                  ? "bg-gradient-to-r from-brand-green/20 via-brand-green/10 to-transparent text-brand-green font-bold shadow-[inset_0_1px_0_rgba(34,197,94,0.2)]"
                  : "text-white/65 hover:text-white hover:bg-white/5"
              )}
            >
              {currentCountry && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 lg:h-3.5 bg-brand-green rounded-r-full shadow-[0_0_10px_rgba(34,197,94,0.8)]" />
              )}
              <div className="flex items-center gap-3 lg:gap-2 min-w-0">
                <Globe className={cn("w-[18px] h-[18px] lg:w-4 lg:h-4 shrink-0 transition-transform group-hover:scale-110", currentCountry ? "text-brand-green" : "text-white/60 group-hover:text-white")} />
                <div className="flex flex-col min-w-0">
                  <span className="truncate">Quốc Gia</span>
                  {activeCountryObj && (
                    <span className="text-xs lg:text-[10px] text-brand-green font-normal truncate">
                      {activeCountryObj.name}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1.5 lg:gap-1 shrink-0 ml-1">
                <span className="text-[10px] lg:text-[9px] px-2 lg:px-1.5 py-0.5 rounded-full bg-white/5 text-white/50 group-hover:bg-brand-green/20 group-hover:text-brand-green font-mono font-bold">
                  {countries.length || "12+"}
                </span>
                <ChevronRight className="w-4 h-4 lg:w-3.5 lg:h-3.5 text-white/40 group-hover:text-white group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>

            {/* Năm Phát Hành (Years Modal Trigger) */}
            <button
              onClick={() => setActiveModal("years")}
              className={cn(
                "w-full relative flex items-center justify-between px-3 lg:px-2 py-2 lg:py-1.5 rounded-xl text-sm lg:text-[13px] font-medium lg:font-semibold transition-colors duration-150 group text-left",
                currentYear
                  ? "bg-gradient-to-r from-brand-green/20 via-brand-green/10 to-transparent text-brand-green font-bold shadow-[inset_0_1px_0_rgba(34,197,94,0.2)]"
                  : "text-white/65 hover:text-white hover:bg-white/5"
              )}
            >
              {currentYear && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 lg:h-3.5 bg-brand-green rounded-r-full shadow-[0_0_10px_rgba(34,197,94,0.8)]" />
              )}
              <div className="flex items-center gap-3 lg:gap-2 min-w-0">
                <Calendar className={cn("w-[18px] h-[18px] lg:w-4 lg:h-4 shrink-0 transition-transform group-hover:scale-110", currentYear ? "text-brand-green" : "text-white/60 group-hover:text-white")} />
                <div className="flex flex-col min-w-0">
                  <span className="whitespace-nowrap">Năm Phát Hành</span>
                  {currentYear && (
                    <span className="text-xs lg:text-[10px] text-brand-green font-normal truncate">
                      Năm {currentYear}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1.5 lg:gap-1 shrink-0 ml-1">
                <span className="text-[10px] lg:text-[9px] px-2 lg:px-1.5 py-0.5 rounded-full bg-white/5 text-white/50 group-hover:bg-brand-green/20 group-hover:text-brand-green font-mono font-bold">
                  {YEARS_LIST.length}+
                </span>
                <ChevronRight className="w-4 h-4 lg:w-3.5 lg:h-3.5 text-white/40 group-hover:text-white group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>
          </div>

          {/* Divider 2 */}
          <div className="h-[1px] bg-white/5 mx-2 lg:mx-1 my-1.5 lg:my-1.5" />

          {/* Personal Group Section */}
          <div className="space-y-1 lg:space-y-1">
            <span className="px-3 lg:px-2 text-[11px] lg:text-[10px] font-extrabold text-white/45 uppercase tracking-wider block mb-1.5 lg:mb-1">
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
                    "relative flex items-center gap-3 lg:gap-2 px-3 lg:px-2 py-2 lg:py-1.5 rounded-xl text-sm lg:text-[13px] font-medium lg:font-semibold transition-all duration-200 group overflow-hidden",
                    active
                      ? "bg-gradient-to-r from-brand-green/20 via-brand-green/10 to-transparent text-brand-green font-bold shadow-[inset_0_1px_0_rgba(34,197,94,0.2)]"
                      : "text-white/60 hover:text-white hover:bg-white/5"
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  {active && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 lg:h-3.5 bg-brand-green rounded-r-full shadow-[0_0_10px_rgba(34,197,94,0.8)]" />
                  )}
                  <Icon className={cn("w-[18px] h-[18px] lg:w-4 lg:h-4 shrink-0 transition-transform group-hover:scale-110", active ? "text-brand-green" : "text-white/60 group-hover:text-white")} />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>

        </div>
      </aside>

      {/* ======================================================== */}
      {/* MODAL BẢNG CHỌN THỂ LOẠI (CATEGORY SELECTION BOARD) */}
      {/* ======================================================== */}
      {activeModal === "categories" && (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-6 animate-in fade-in duration-200">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/80"
            onClick={() => setActiveModal(null)}
          />

          {/* Modal Content Board (Bottom Sheet on Mobile, Centered on Desktop) */}
          <div className="relative z-10 w-full sm:max-w-4xl max-h-[85dvh] sm:max-h-[82vh] bg-[#0c121d] border-t sm:border border-white/10 rounded-t-[24px] sm:rounded-3xl p-3.5 sm:p-7 flex flex-col shadow-none overflow-hidden animate-in slide-in-from-bottom-3 sm:zoom-in-95 duration-200 transform-gpu">
            {/* Mobile Sheet Handle Bar */}
            <div className="sm:hidden w-10 h-1 bg-white/20 rounded-full mx-auto mb-2.5 shrink-0" />

            {/* Modal Header */}
            <div className="relative z-10 flex items-center justify-between pb-3 sm:pb-4 border-b border-white/10 shrink-0 gap-3">
              <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-brand-green/20 border border-brand-green/30 flex items-center justify-center text-brand-green shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h3 className="text-base sm:text-xl font-extrabold text-white tracking-tight truncate">
                  Tất Cả Thể Loại
                </h3>
                <span className="text-[10px] sm:text-[11px] font-semibold text-brand-green bg-brand-green/10 border border-brand-green/25 px-2 py-0.5 rounded-full shrink-0">
                  {categories.length} THỂ LOẠI
                </span>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setActiveModal(null)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/15 text-white/80 hover:text-white border border-white/10 transition-all shrink-0 active:scale-95"
                aria-label="Đóng bảng"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Filter Search Box */}
            <div className="relative z-10 my-3 shrink-0">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
                <input
                  type="text"
                  style={{ fontSize: "16px" }}
                  value={categorySearchQuery}
                  onChange={(e) => setCategorySearchQuery(e.target.value)}
                  placeholder="Lọc nhanh thể loại (Hành động, Cổ trang, Kinh dị...)"
                  className="w-full bg-white/[0.06] border border-white/10 focus:border-white/25 text-white placeholder-white/30 text-[16px] sm:text-sm rounded-xl pl-10 pr-4 py-2.5 outline-none transition-all"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                />
              </div>
            </div>

            {/* Categories Interactive Grid */}
            <div className="relative z-10 flex-1 overflow-y-auto pr-1 custom-scrollbar overscroll-contain -webkit-overflow-scrolling-touch">
              {filteredCategories.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-2.5 pb-4">
                  {filteredCategories.map((cat) => {
                    const active = currentCategory === cat.slug;
                    return (
                      <button
                        key={cat.slug}
                        onClick={() => handleSelectCategory(cat.slug)}
                        className={cn(
                          "relative flex items-center justify-between p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border text-left transition-all duration-200 group active:scale-95 min-w-0 shadow-none",
                          active
                            ? "bg-brand-green/20 border-brand-green/50 text-brand-green"
                            : "bg-white/[0.03] hover:bg-white/[0.08] border-white/5 hover:border-brand-green/30 text-white/80 hover:text-white"
                        )}
                      >
                        <div className="flex items-center gap-2 min-w-0 truncate">
                          <span
                            className={cn(
                              "w-2 h-2 rounded-full shrink-0 transition-all",
                              active
                                ? "bg-brand-green scale-125"
                                : "bg-white/20 group-hover:bg-brand-green"
                            )}
                          />
                          <span className="text-xs sm:text-sm font-semibold truncate">
                            {cat.name}
                          </span>
                        </div>
                        {active && (
                          <Check className="w-4 h-4 text-brand-green shrink-0 ml-1" />
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="py-12 text-center text-white/40 text-sm">
                  Không tìm thấy thể loại nào phù hợp với &quot;{categorySearchQuery}&quot;
                </div>
              )}
            </div>

            {/* Modal Bottom Action / Hint */}
            <div className="relative z-10 pt-2.5 mt-2 border-t border-white/10 flex items-center justify-between text-xs text-white/40 shrink-0 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
              <span className="truncate mr-2">Bấm vào thể loại để lọc phim ngay</span>
              <button
                onClick={() => {
                  setActiveModal(null);
                  router.push("/");
                }}
                className="text-brand-green hover:underline font-semibold shrink-0"
              >
                Xem tất cả
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL BẢNG CHỌN QUỐC GIA (COUNTRY SELECTION BOARD) */}
      {/* ======================================================== */}
      {activeModal === "countries" && (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-6 animate-in fade-in duration-200">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/80"
            onClick={() => setActiveModal(null)}
          />

          {/* Modal Content Board (Bottom Sheet on Mobile, Centered on Desktop) */}
          <div className="relative z-10 w-full sm:max-w-4xl max-h-[85dvh] sm:max-h-[82vh] bg-[#0c121d] border-t sm:border border-white/10 rounded-t-[24px] sm:rounded-3xl p-3.5 sm:p-7 flex flex-col shadow-none overflow-hidden animate-in slide-in-from-bottom-3 sm:zoom-in-95 duration-200 transform-gpu">
            {/* Mobile Sheet Handle Bar */}
            <div className="sm:hidden w-10 h-1 bg-white/20 rounded-full mx-auto mb-2.5 shrink-0" />

            {/* Modal Header */}
            <div className="relative z-10 flex items-center justify-between pb-3 sm:pb-4 border-b border-white/10 shrink-0 gap-3">
              <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-brand-green/20 border border-brand-green/30 flex items-center justify-center text-brand-green shrink-0">
                  <Globe className="w-4 h-4" />
                </div>
                <h3 className="text-base sm:text-xl font-extrabold text-white tracking-tight truncate">
                  Quốc Gia Điện Ảnh
                </h3>
                <span className="text-[10px] sm:text-[11px] font-semibold text-brand-green bg-brand-green/10 border border-brand-green/25 px-2 py-0.5 rounded-full shrink-0">
                  TOÀN THẾ GIỚI
                </span>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setActiveModal(null)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/15 text-white/80 hover:text-white border border-white/10 transition-all shrink-0 active:scale-95"
                aria-label="Đóng bảng"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Filter Search Box */}
            <div className="relative z-10 my-3 shrink-0">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
                <input
                  type="text"
                  style={{ fontSize: "16px" }}
                  value={countrySearchQuery}
                  onChange={(e) => setCountrySearchQuery(e.target.value)}
                  placeholder="Lọc nhanh quốc gia (Hàn Quốc, Trung Quốc, Âu Mỹ...)"
                  className="w-full bg-white/[0.06] border border-white/10 focus:border-white/25 text-white placeholder-white/30 text-[16px] sm:text-sm rounded-xl pl-10 pr-4 py-2.5 outline-none transition-all"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                />
              </div>
            </div>

            {/* Countries Interactive Grid */}
            <div className="relative z-10 flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-4 overscroll-contain -webkit-overflow-scrolling-touch">
              {!countrySearchQuery.trim() && (
                <div>
                  <span className="text-[11px] font-bold text-white/50 uppercase tracking-widest block mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-brand-green animate-pulse" />
                    Quốc Gia Nổi Bật Nhất
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
                    {sortedCountries.slice(0, 8).map((c) => {
                      const active = currentCountry === c.slug;
                      const code = c.code || getCountryCode(c.slug);
                      return (
                        <button
                          key={c.slug}
                          onClick={() => handleSelectCountry(c.slug)}
                          className={cn(
                            "relative p-3 sm:p-3.5 rounded-xl sm:rounded-2xl border text-center transition-all duration-200 group flex flex-col items-center justify-center gap-1.5 sm:gap-2 active:scale-95 min-w-0 shadow-none",
                            active
                              ? "bg-brand-green/20 border-brand-green/50 text-brand-green"
                              : "bg-white/[0.04] hover:bg-white/[0.08] border-white/5 hover:border-brand-green/30 text-white/80 hover:text-white"
                          )}
                        >
                          {(!code || code === "WW") ? (
                            <Globe className="w-5 h-5 sm:w-6 sm:h-6 text-brand-green group-hover:scale-110 transition-transform" />
                          ) : (
                            <img
                              src={`https://flagcdn.com/w80/${code.toLowerCase()}.png`}
                              alt={c.name}
                              className="w-7 sm:w-8 h-5 sm:h-5.5 object-cover rounded-[3px] group-hover:scale-110 transition-transform"
                            />
                          )}
                          <span className="text-xs sm:text-sm font-bold truncate w-full">
                            {c.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <span className="text-[11px] font-bold text-white/50 uppercase tracking-widest block mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-white/30" />
                  {countrySearchQuery.trim() ? "Kết Quả Tìm Kiếm" : "Tất Cả Quốc Gia"}
                </span>

                {filteredCountries.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 pb-4">
                    {filteredCountries.map((c) => {
                      const active = currentCountry === c.slug;
                      const code = c.code || getCountryCode(c.slug);
                      return (
                        <button
                          key={c.slug}
                          onClick={() => handleSelectCountry(c.slug)}
                          className={cn(
                            "relative flex items-center justify-between p-2.5 sm:p-3 rounded-xl border text-left transition-all duration-200 group active:scale-95 min-w-0 shadow-none",
                            active
                              ? "bg-brand-green/20 border-brand-green/50 text-brand-green"
                              : "bg-white/[0.02] hover:bg-white/[0.06] border-white/5 hover:border-brand-green/30 text-white/75 hover:text-white"
                          )}
                        >
                          <div className="flex items-center gap-2 min-w-0 truncate">
                            {(!code || code === "WW") ? (
                              <Globe className="w-4 h-4 text-white/40 group-hover:text-brand-green shrink-0" />
                            ) : (
                              <img
                                src={`https://flagcdn.com/w40/${code.toLowerCase()}.png`}
                                alt={c.name}
                                className="w-5 h-3.5 object-cover rounded-[2px] opacity-80 group-hover:opacity-100 shrink-0"
                              />
                            )}
                            <span className="text-xs font-semibold truncate">
                              {c.name}
                            </span>
                          </div>
                          {active && (
                            <Check className="w-3.5 h-3.5 text-brand-green shrink-0 ml-1" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-12 text-center text-white/40 text-sm">
                    Không tìm thấy quốc gia nào phù hợp với &quot;{countrySearchQuery}&quot;
                  </div>
                )}
              </div>
            </div>

            {/* Modal Bottom Action / Hint */}
            <div className="relative z-10 pt-2.5 mt-2 border-t border-white/10 flex items-center justify-between text-xs text-white/40 shrink-0 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
              <span className="truncate mr-2">Bấm vào quốc gia để lọc phim ngay</span>
              <button
                onClick={() => {
                  setActiveModal(null);
                  router.push("/");
                }}
                className="text-brand-green hover:underline font-semibold shrink-0"
              >
                Xem tất cả
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ======================================================== */}
      {/* MODAL BẢNG CHỌN NĂM PHÁT HÀNH (YEAR SELECTION BOARD) */}
      {/* ======================================================== */}
      {activeModal === "years" && (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-6 animate-in fade-in duration-200">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/80"
            onClick={() => setActiveModal(null)}
          />

          {/* Modal Content Board (Bottom Sheet on Mobile, Centered on Desktop) */}
          <div className="relative z-10 w-full sm:max-w-4xl max-h-[85dvh] sm:max-h-[82vh] bg-[#0c121d] border-t sm:border border-white/10 rounded-t-[24px] sm:rounded-3xl p-3.5 sm:p-7 flex flex-col shadow-none overflow-hidden animate-in slide-in-from-bottom-3 sm:zoom-in-95 duration-200 transform-gpu">
            {/* Mobile Sheet Handle Bar */}
            <div className="sm:hidden w-10 h-1 bg-white/20 rounded-full mx-auto mb-2.5 shrink-0" />

            {/* Modal Header */}
            <div className="relative z-10 flex items-center justify-between pb-3 sm:pb-4 border-b border-white/10 shrink-0 gap-2">
              <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-brand-green/20 border border-brand-green/30 flex items-center justify-center text-brand-green shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <h3 className="text-base sm:text-xl font-extrabold text-white tracking-tight truncate">
                  Năm Phát Hành
                </h3>
                <span className="hidden xs:inline-flex text-[10px] sm:text-[11px] font-semibold text-brand-green bg-brand-green/10 border border-brand-green/25 px-2 py-0.5 rounded-full shrink-0">
                  1980 - {currentYearNum}
                </span>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setActiveModal(null)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/15 text-white/80 hover:text-white border border-white/10 transition-all shrink-0 active:scale-95"
                aria-label="Đóng bảng"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Filter Search Box */}
            <div className="relative z-10 my-2.5 sm:my-3 shrink-0">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
                <input
                  type="text"
                  style={{ fontSize: "16px" }}
                  value={yearSearchQuery}
                  onChange={(e) => setYearSearchQuery(e.target.value)}
                  placeholder="Lọc nhanh năm (2026, 2025, 2020...)"
                  className="w-full bg-white/[0.06] border border-white/10 focus:border-white/25 text-white placeholder-white/30 text-[16px] sm:text-sm rounded-xl pl-10 pr-9 py-2 sm:py-2.5 outline-none transition-all"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                />
                {yearSearchQuery && (
                  <button
                    onClick={() => setYearSearchQuery("")}
                    aria-label="Xóa tìm kiếm"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-white/40 hover:text-white rounded-md"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Years Interactive Content */}
            <div className="relative z-10 flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-3.5 sm:space-y-4 overscroll-contain -webkit-overflow-scrolling-touch">
              {!yearSearchQuery.trim() && (
                <div>
                  <span className="text-[10px] sm:text-[11px] font-bold text-white/50 uppercase tracking-widest block mb-2 flex items-center gap-1.5 sm:gap-2">
                    <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-brand-green animate-pulse" />
                    Năm Gần Đây Nổi Bật
                  </span>
                  <div className="grid grid-cols-4 sm:grid-cols-4 gap-1.5 sm:gap-2.5">
                    {HIGHLIGHT_YEARS.map((y) => {
                      const active = currentYear === String(y);
                      return (
                        <button
                          key={y}
                          onClick={() => handleSelectYear(y)}
                          className={cn(
                            "relative py-2 sm:py-2.5 px-1.5 sm:px-2 rounded-xl sm:rounded-2xl border text-center transition-all duration-200 group flex flex-col items-center justify-center gap-0.5 active:scale-95 min-w-0 shadow-none",
                            active
                              ? "bg-brand-green/20 border-brand-green/50 text-brand-green font-bold"
                              : "bg-white/[0.04] hover:bg-white/[0.08] border-white/5 hover:border-brand-green/30 text-white/90 hover:text-white"
                          )}
                        >
                          <div className="flex items-center gap-1 sm:gap-1.5">
                            <span
                              className={cn(
                                "w-1.5 h-1.5 rounded-full shrink-0 transition-all",
                                active
                                  ? "bg-brand-green scale-125"
                                  : "bg-white/25 group-hover:bg-brand-green"
                              )}
                            />
                            <span className="text-xs sm:text-sm font-extrabold tracking-tight">
                              {y}
                            </span>
                          </div>
                          <span
                            className={cn(
                              "text-[9px] sm:text-[10px] font-mono",
                              active ? "text-brand-green font-semibold" : "text-white/35"
                            )}
                          >
                            {active ? "Đang chọn" : "Nổi bật"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <span className="text-[10px] sm:text-[11px] font-bold text-white/50 uppercase tracking-widest block mb-2 flex items-center gap-1.5 sm:gap-2">
                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-white/30" />
                  {yearSearchQuery.trim() ? "Kết Quả Tìm Kiếm" : "Tất Cả Các Năm"}
                </span>

                {filteredYears.length > 0 ? (
                  <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-1.5 sm:gap-2 pb-4">
                    {filteredYears.map((y) => {
                      const active = currentYear === String(y);
                      return (
                        <button
                          key={y}
                          onClick={() => handleSelectYear(y)}
                          className={cn(
                            "relative flex items-center justify-center py-2 sm:py-2.5 px-1 rounded-xl border text-center transition-all duration-200 group active:scale-95 min-w-0 font-medium shadow-none",
                            active
                              ? "bg-brand-green/20 border-brand-green/50 text-brand-green font-bold"
                              : "bg-white/[0.02] hover:bg-white/[0.06] border-white/5 hover:border-brand-green/30 text-white/75 hover:text-white"
                          )}
                        >
                          <span className="text-xs sm:text-sm font-semibold truncate">
                            {y}
                          </span>
                          {active && (
                            <Check className="w-3 h-3 text-brand-green shrink-0 ml-1" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-12 text-center text-white/40 text-sm">
                    Không tìm thấy năm nào phù hợp với &quot;{yearSearchQuery}&quot;
                  </div>
                )}
              </div>
            </div>

            {/* Modal Bottom Action / Hint */}
            <div className="relative z-10 pt-2.5 sm:pt-3 mt-1.5 sm:mt-2 border-t border-white/10 flex items-center justify-between text-xs text-white/40 shrink-0 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              <span className="truncate mr-2 text-[11px] sm:text-xs">Bấm vào năm để lọc phim ngay</span>
              <button
                onClick={() => {
                  setActiveModal(null);
                  router.push("/");
                }}
                className="text-brand-green hover:underline font-semibold shrink-0 text-xs"
              >
                Xem tất cả
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
