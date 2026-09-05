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
  const router = useRouter();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Active selection modal: 'categories' | 'countries' | null
  const [activeModal, setActiveModal] = useState<"categories" | "countries" | null>(null);
  const [categorySearchQuery, setCategorySearchQuery] = useState("");
  const [countrySearchQuery, setCountrySearchQuery] = useState("");

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
      return pathname === "/" && !currentTypeList && !currentCountry && !currentCategory;
    }
    return pathname.startsWith(href);
  };

  const sortedCountries = useMemo(() => {
    return sortCountriesByPopularity(countries);
  }, [countries]);

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

  // If in Theatre Mode during video watching, auto-hide sidebar
  if (isTheatreMode) return null;

  return (
    <>
      {/* Mobile Drawer Trigger (Only visible on small screens) */}
      <button
        onClick={() => setIsMobileOpen(true)}
        aria-label="Mở Menu"
        className="lg:hidden fixed top-4 left-4 z-[110] w-10 h-10 flex items-center justify-center rounded-full bg-[#141414]/90 border border-white/10 text-white/80 hover:text-white backdrop-blur-xl shadow-lg transition-transform active:scale-95"
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
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-2.5 space-y-3.5 scrollbar-hide">
          
          {/* Main Nav Section */}
          <div className="space-y-0.5">
            <span className="px-2.5 text-[9px] font-bold text-white/35 uppercase tracking-widest block mb-1">
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
                    "relative flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200 group overflow-hidden",
                    active
                      ? "bg-gradient-to-r from-brand-green/20 via-brand-green/10 to-transparent text-brand-green font-bold shadow-[inset_0_1px_0_rgba(34,197,94,0.2)]"
                      : "text-white/60 hover:text-white hover:bg-white/5"
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  {active && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-brand-green rounded-r-full shadow-[0_0_10px_rgba(34,197,94,0.8)]" />
                  )}
                  <Icon className={cn("w-4 h-4 shrink-0 transition-transform group-hover:scale-110", active ? "text-brand-green" : "text-white/60 group-hover:text-white")} />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="h-[1px] bg-white/5 mx-1.5" />

          {/* Discovery / Selection Boards Trigger */}
          <div className="space-y-0.5">
            <span className="px-2.5 text-[9px] font-bold text-white/35 uppercase tracking-widest block mb-1">
              KHÁM PHÁ
            </span>

            {/* Thể Loại (Categories Modal Trigger) */}
            <button
              onClick={() => setActiveModal("categories")}
              className={cn(
                "w-full relative flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200 group text-left",
                currentCategory
                  ? "bg-gradient-to-r from-brand-green/20 via-brand-green/10 to-transparent text-brand-green font-bold shadow-[inset_0_1px_0_rgba(34,197,94,0.2)]"
                  : "text-white/65 hover:text-white hover:bg-white/5"
              )}
            >
              {currentCategory && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-brand-green rounded-r-full shadow-[0_0_10px_rgba(34,197,94,0.8)]" />
              )}
              <div className="flex items-center gap-2.5 truncate">
                <Layers className={cn("w-4 h-4 shrink-0 transition-transform group-hover:scale-110", currentCategory ? "text-brand-green" : "text-white/60 group-hover:text-white")} />
                <div className="flex flex-col min-w-0">
                  <span className="truncate">Thể Loại</span>
                  {activeCategoryObj && (
                    <span className="text-[10px] text-brand-green font-normal truncate">
                      {activeCategoryObj.name}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0 ml-1">
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/5 text-white/50 group-hover:bg-brand-green/20 group-hover:text-brand-green font-mono">
                  {categories.length || "24"}
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-white/40 group-hover:text-white group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>

            {/* Quốc Gia (Countries Modal Trigger) */}
            <button
              onClick={() => setActiveModal("countries")}
              className={cn(
                "w-full relative flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200 group text-left",
                currentCountry
                  ? "bg-gradient-to-r from-brand-green/20 via-brand-green/10 to-transparent text-brand-green font-bold shadow-[inset_0_1px_0_rgba(34,197,94,0.2)]"
                  : "text-white/65 hover:text-white hover:bg-white/5"
              )}
            >
              {currentCountry && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-brand-green rounded-r-full shadow-[0_0_10px_rgba(34,197,94,0.8)]" />
              )}
              <div className="flex items-center gap-2.5 truncate">
                <Globe className={cn("w-4 h-4 shrink-0 transition-transform group-hover:scale-110", currentCountry ? "text-brand-green" : "text-white/60 group-hover:text-white")} />
                <div className="flex flex-col min-w-0">
                  <span className="truncate">Quốc Gia</span>
                  {activeCountryObj && (
                    <span className="text-[10px] text-brand-green font-normal truncate">
                      {activeCountryObj.name}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0 ml-1">
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/5 text-white/50 group-hover:bg-brand-green/20 group-hover:text-brand-green font-mono">
                  {countries.length || "12+"}
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-white/40 group-hover:text-white group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>
          </div>

          <div className="h-[1px] bg-white/5 mx-1.5" />

          {/* Personal Group Section */}
          <div className="space-y-0.5">
            <span className="px-2.5 text-[9px] font-bold text-white/35 uppercase tracking-widest block mb-1">
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
                    "relative flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200 group overflow-hidden",
                    active
                      ? "bg-gradient-to-r from-brand-green/20 via-brand-green/10 to-transparent text-brand-green font-bold shadow-[inset_0_1px_0_rgba(34,197,94,0.2)]"
                      : "text-white/60 hover:text-white hover:bg-white/5"
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  {active && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-brand-green rounded-r-full shadow-[0_0_10px_rgba(34,197,94,0.8)]" />
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

      {/* ======================================================== */}
      {/* MODAL BẢNG CHỌN THỂ LOẠI (CATEGORY SELECTION BOARD) */}
      {/* ======================================================== */}
      {activeModal === "categories" && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
            onClick={() => setActiveModal(null)}
          />

          {/* Modal Content Board */}
          <div className="relative z-10 w-full max-w-4xl max-h-[85vh] sm:max-h-[80vh] bg-[#0c121d]/95 backdrop-blur-2xl border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-7 flex flex-col shadow-[0_30px_90px_rgba(0,0,0,0.9)] overflow-hidden animate-in fade-in duration-200">
            {/* Ambient Background Glow */}
            <div className="absolute -top-32 -right-32 w-72 h-72 bg-brand-green/15 rounded-full blur-[100px] pointer-events-none" />

            {/* Modal Header */}
            <div className="relative z-10 flex items-start justify-between pb-4 border-b border-white/10 shrink-0 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-brand-green/20 border border-brand-green/30 flex items-center justify-center text-brand-green">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
                    Tất Cả Thể Loại
                  </h3>
                  <span className="text-[11px] font-semibold text-brand-green bg-brand-green/10 border border-brand-green/25 px-2.5 py-0.5 rounded-full">
                    {categories.length} THỂ LOẠI
                  </span>
                </div>
                <p className="text-xs text-white/50 hidden sm:block">
                  Chọn thể loại bạn yêu thích để khám phá kho phim 50,000+ tập chất lượng cao
                </p>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setActiveModal(null)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/5 transition-all shrink-0"
                aria-label="Đóng bảng"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Filter Search Box */}
            <div className="relative z-10 my-4 shrink-0">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
                <input
                  type="text"
                  value={categorySearchQuery}
                  onChange={(e) => setCategorySearchQuery(e.target.value)}
                  placeholder="Lọc nhanh thể loại (Hành động, Cổ trang, Kinh dị...)"
                  className="w-full bg-[#141d2b]/80 border border-white/10 focus:border-brand-green/50 text-white placeholder-white/30 text-base sm:text-sm rounded-xl pl-10 pr-4 py-2.5 outline-none transition-all"
                  autoComplete="off"
                />
              </div>
            </div>

            {/* Categories Interactive Grid */}
            <div className="relative z-10 flex-1 overflow-y-auto pr-1.5 custom-scrollbar">
              {filteredCategories.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-2.5 pb-2">
                  {filteredCategories.map((cat) => {
                    const active = currentCategory === cat.slug;
                    return (
                      <button
                        key={cat.slug}
                        onClick={() => handleSelectCategory(cat.slug)}
                        className={cn(
                          "relative flex items-center justify-between p-3 rounded-2xl border text-left transition-all duration-200 group active:scale-95",
                          active
                            ? "bg-brand-green/20 border-brand-green/50 text-brand-green shadow-[0_0_20px_rgba(34,197,94,0.25)]"
                            : "bg-white/[0.03] hover:bg-white/[0.08] border-white/5 hover:border-brand-green/30 text-white/80 hover:text-white"
                        )}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className={cn(
                              "w-2 h-2 rounded-full shrink-0 transition-all",
                              active
                                ? "bg-brand-green shadow-[0_0_8px_rgba(34,197,94,0.9)] scale-125"
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
            <div className="relative z-10 pt-3 mt-3 border-t border-white/10 flex items-center justify-between text-xs text-white/40 shrink-0">
              <span>Bấm vào thể loại để lọc phim ngay</span>
              <button
                onClick={() => {
                  setActiveModal(null);
                  router.push("/");
                }}
                className="text-brand-green hover:underline font-semibold"
              >
                Xem tất cả phim
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL BẢNG CHỌN QUỐC GIA (COUNTRY SELECTION BOARD) */}
      {/* ======================================================== */}
      {activeModal === "countries" && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
            onClick={() => setActiveModal(null)}
          />

          {/* Modal Content Board */}
          <div className="relative z-10 w-full max-w-4xl max-h-[85vh] sm:max-h-[80vh] bg-[#0c121d]/95 backdrop-blur-2xl border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-7 flex flex-col shadow-[0_30px_90px_rgba(0,0,0,0.9)] overflow-hidden animate-in fade-in duration-200">
            {/* Ambient Background Glow */}
            <div className="absolute -top-32 -left-32 w-72 h-72 bg-brand-green/15 rounded-full blur-[100px] pointer-events-none" />

            {/* Modal Header */}
            <div className="relative z-10 flex items-start justify-between pb-4 border-b border-white/10 shrink-0 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-brand-green/20 border border-brand-green/30 flex items-center justify-center text-brand-green">
                    <Globe className="w-4 h-4" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
                    Quốc Gia Điện Ảnh
                  </h3>
                  <span className="text-[11px] font-semibold text-brand-green bg-brand-green/10 border border-brand-green/25 px-2.5 py-0.5 rounded-full">
                    TOÀN THẾ GIỚI
                  </span>
                </div>
                <p className="text-xs text-white/50 hidden sm:block">
                  Khám phá các nền điện ảnh nổi tiếng thế giới: Trung Quốc, Hàn Quốc, Âu Mỹ, Nhật Bản...
                </p>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setActiveModal(null)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/5 transition-all shrink-0"
                aria-label="Đóng bảng"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Filter Search Box */}
            <div className="relative z-10 my-4 shrink-0">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
                <input
                  type="text"
                  value={countrySearchQuery}
                  onChange={(e) => setCountrySearchQuery(e.target.value)}
                  placeholder="Lọc nhanh quốc gia (Hàn Quốc, Trung Quốc, Âu Mỹ...)"
                  className="w-full bg-[#141d2b]/80 border border-white/10 focus:border-brand-green/50 text-white placeholder-white/30 text-base sm:text-sm rounded-xl pl-10 pr-4 py-2.5 outline-none transition-all"
                  autoComplete="off"
                />
              </div>
            </div>

            {/* Countries Interactive Grid */}
            <div className="relative z-10 flex-1 overflow-y-auto pr-1.5 custom-scrollbar space-y-5">
              {!countrySearchQuery.trim() && (
                <div>
                  <span className="text-[11px] font-bold text-white/50 uppercase tracking-widest block mb-2.5 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-brand-green animate-pulse" />
                    Quốc Gia Nổi Bật Nhất
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {sortedCountries.slice(0, 8).map((c) => {
                      const active = currentCountry === c.slug;
                      const code = c.code || getCountryCode(c.slug);
                      return (
                        <button
                          key={c.slug}
                          onClick={() => handleSelectCountry(c.slug)}
                          className={cn(
                            "relative p-3.5 rounded-2xl border text-center transition-all duration-200 group flex flex-col items-center justify-center gap-2 active:scale-95",
                            active
                              ? "bg-brand-green/20 border-brand-green/50 text-brand-green shadow-[0_0_20px_rgba(34,197,94,0.25)]"
                              : "bg-white/[0.04] hover:bg-white/[0.08] border-white/5 hover:border-brand-green/30 text-white/80 hover:text-white"
                          )}
                        >
                          {(!code || code === "WW") ? (
                            <Globe className="w-6 h-6 text-brand-green group-hover:scale-110 transition-transform" />
                          ) : (
                            <img
                              src={`https://flagcdn.com/w80/${code.toLowerCase()}.png`}
                              alt={c.name}
                              className="w-8 h-5.5 object-cover rounded-[4px] shadow-md group-hover:scale-110 transition-transform"
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
                <span className="text-[11px] font-bold text-white/50 uppercase tracking-widest block mb-2.5 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-white/30" />
                  {countrySearchQuery.trim() ? "Kết Quả Tìm Kiếm" : "Tất Cả Quốc Gia"}
                </span>

                {filteredCountries.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {filteredCountries.map((c) => {
                      const active = currentCountry === c.slug;
                      const code = c.code || getCountryCode(c.slug);
                      return (
                        <button
                          key={c.slug}
                          onClick={() => handleSelectCountry(c.slug)}
                          className={cn(
                            "relative flex items-center justify-between p-2.5 sm:p-3 rounded-xl border text-left transition-all duration-200 group active:scale-95",
                            active
                              ? "bg-brand-green/20 border-brand-green/50 text-brand-green"
                              : "bg-white/[0.02] hover:bg-white/[0.06] border-white/5 hover:border-brand-green/30 text-white/75 hover:text-white"
                          )}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {(!code || code === "WW") ? (
                              <Globe className="w-4 h-4 text-white/40 group-hover:text-brand-green shrink-0" />
                            ) : (
                              <img
                                src={`https://flagcdn.com/w40/${code.toLowerCase()}.png`}
                                alt={c.name}
                                className="w-5 h-3.5 object-cover rounded-[2px] opacity-80 group-hover:opacity-100 shrink-0 shadow-sm"
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
            <div className="relative z-10 pt-3 mt-3 border-t border-white/10 flex items-center justify-between text-xs text-white/40 shrink-0">
              <span>Bấm vào quốc gia để lọc phim ngay</span>
              <button
                onClick={() => {
                  setActiveModal(null);
                  router.push("/");
                }}
                className="text-brand-green hover:underline font-semibold"
              >
                Xem tất cả phim
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
