"use client";

import { useState, useEffect, useMemo, useRef, startTransition, Suspense, memo } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { useUserAuth } from "@/context/user-auth-context";
import { toast } from "sonner";
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
  RotateCcw,
  Layers,
  Search,
  Check,
  Calendar,
  Trophy,
  User,
  LogIn,
  LogOut,
  RefreshCw,
  ShieldCheck,
  Crown,
  Shield,
  Users,
  Settings,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { sortCountriesByPopularity, getCountryCode } from "@/lib/countries";
import { instantMovieStore } from "@/lib/instant-movie-store";
import MobileExploreSheet from "@/components/navigation/mobile-explore-sheet";
import BrandLogo from "@/components/ui/brand-logo";
import { useNavigationTab } from "@/context/navigation-tab-context";

interface SidebarProps {
  categories?: { slug: string; name: string }[];
  countries?: { slug: string; name: string }[];
}

const NAV_MAIN = [
  { href: "/", label: "Trang Chủ", icon: Home },
  // { href: "/bang-xep-hang", label: "Bảng Xếp Hạng", icon: Trophy }, // Tạm ẩn theo yêu cầu
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

function SidebarContent({
  categories: propCategories = [],
  countries: propCountries = [],
}: SidebarProps) {
  const { user, openAuthModal, logout, syncWithServer } = useUserAuth();
  const isSuperAdmin = Boolean(
    user && (user.role === "superadmin" || user.role === "admin" || user.email?.toLowerCase() === "kimdinhphuong205@gmail.com")
  );
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { activeTab, setActiveTab, navigateToTab } = useNavigationTab();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isExploreOpen, setIsExploreOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Active selection modal: 'categories' | 'countries' | 'years' | null
  const [activeModal, setActiveModal] = useState<"categories" | "countries" | "years" | null>(null);
  const [categorySearchQuery, setCategorySearchQuery] = useState("");
  const [countrySearchQuery, setCountrySearchQuery] = useState("");
  const [yearSearchQuery, setYearSearchQuery] = useState("");
  const [yearDecade, setYearDecade] = useState<"all" | "2020s" | "2010s" | "2000s" | "classic">("all");

  // Listen for open-mobile-explore event from mobile header category button
  useEffect(() => {
    const handleOpenExplore = () => {
      setIsExploreOpen(true);
      setIsMobileOpen(false);
      setIsAccountOpen(false);
      setActiveModal(null);
    };
    window.addEventListener("open-mobile-explore", handleOpenExplore);
    return () => window.removeEventListener("open-mobile-explore", handleOpenExplore);
  }, []);

  // Scroll container refs for selection modals
  const categoriesScrollRef = useRef<HTMLDivElement>(null);
  const countriesScrollRef = useRef<HTMLDivElement>(null);
  const yearsScrollRef = useRef<HTMLDivElement>(null);

  const handleManualSync = async () => {
    setIsSyncing(true);
    await syncWithServer();
    setIsSyncing(false);
    toast.success("Đã đồng bộ phim yêu thích & lịch sử xem!");
  };

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
    setIsExploreOpen(false);
    setActiveModal(null);
    setCategorySearchQuery("");
    setCountrySearchQuery("");
    setYearSearchQuery("");
    setYearDecade("all");
  }, [pathname, searchParams]);

  // Prefetch mobile bottom nav routes for instant 0ms transition on single tap
  useEffect(() => {
    router.prefetch("/");
    router.prefetch("/recently");
    router.prefetch("/favorites");
  }, [router]);

  const handleBottomNavNavigate = (href: string, e?: React.MouseEvent) => {
    setIsMobileOpen(false);
    setIsAccountOpen(false);
    setIsExploreOpen(false);
    setActiveModal(null);
    setCategorySearchQuery("");
    setCountrySearchQuery("");
    setYearSearchQuery("");

    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "instant" });
    }

    navigateToTab(href);

    if (pathname === href && !hasActiveFilters) {
      if (e) e.preventDefault();
    }
  };

  // Listen for Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveModal(null);
        setIsAccountOpen(false);
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
  const currentTypeList = searchParams.get("typeList") || searchParams.get("typelist");
  const hasActiveFilters = Boolean(
    currentTypeList ||
    currentCountry ||
    currentCategory ||
    currentYear ||
    searchParams.get("topic") ||
    searchParams.get("q")
  );

  // Find active names
  const activeCategoryObj = useMemo(() => {
    return categories.find((c) => c.slug === currentCategory);
  }, [categories, currentCategory]);

  const activeCountryObj = useMemo(() => {
    return countries.find((c) => c.slug === currentCountry);
  }, [countries, currentCountry]);

  const isLinkActive = (href: string, typeList?: string) => {
    if (typeList) {
      return pathname === "/" && (currentTypeList === typeList || searchParams.get("typelist") === typeList);
    }
    if (href === "/") {
      return pathname === "/" && !hasActiveFilters;
    }
    return pathname.startsWith(href);
  };

  const currentActiveTab = useMemo(() => {
    if (isAccountOpen) return "account";
    if (
      activeTab === "/?typeList=phim-chieu-rap" ||
      (pathname === "/" && (currentTypeList === "phim-chieu-rap" || searchParams.get("typelist") === "phim-chieu-rap"))
    ) {
      return "chieu-rap";
    }
    if (activeTab) return activeTab;
    if (pathname === "/recently") return "/recently";
    if (pathname === "/favorites") return "/favorites";
    if (pathname === "/" && !hasActiveFilters) return "/";
    return null;
  }, [isAccountOpen, activeTab, pathname, currentTypeList, searchParams, hasActiveFilters]);

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

  const displayedYears = useMemo(() => {
    if (yearSearchQuery.trim()) return filteredYears;
    if (yearDecade === "2020s") return filteredYears.filter((y) => y >= 2020);
    if (yearDecade === "2010s") return filteredYears.filter((y) => y >= 2010 && y <= 2019);
    if (yearDecade === "2000s") return filteredYears.filter((y) => y >= 2000 && y <= 2009);
    if (yearDecade === "classic") return filteredYears.filter((y) => y < 2000);
    return filteredYears;
  }, [filteredYears, yearSearchQuery, yearDecade]);

  const [isClosing, setIsClosing] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);

  const closeModal = (e?: React.SyntheticEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (isClosing) return;
    setActiveModal(null);
    setIsClosing(false);
    setCategorySearchQuery("");
    setCountrySearchQuery("");
    setYearSearchQuery("");
    setYearDecade("all");
  };

  const handleSelectCategory = (slug: string, e?: React.SyntheticEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setActiveModal(null);
    setIsMobileOpen(false);
    setIsExploreOpen(false);
    setIsSelecting(false);
    router.push(`/?category=${slug}`, { scroll: false });
  };

  const handleSelectCountry = (slug: string, e?: React.SyntheticEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setActiveModal(null);
    setIsMobileOpen(false);
    setIsExploreOpen(false);
    setIsSelecting(false);
    router.push(`/?country=${slug}`, { scroll: false });
  };

  const handleSelectYear = (year: number | string, e?: React.SyntheticEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setActiveModal(null);
    setIsMobileOpen(false);
    setIsExploreOpen(false);
    setIsSelecting(false);
    router.push(`/?year=${year}`, { scroll: false });
  };

  return (
    <>
      {/* ======================================================== */}
      {/* MOBILE BOTTOM NAVIGATION BAR (AURAFLIX CURVED NOTCH DOCK) */}
      {/* ======================================================== */}
      <nav
        aria-label="Điều hướng chính"
        className="lg:hidden fixed left-0 right-0 bottom-0 z-[140] w-full max-w-lg mx-auto pointer-events-auto select-none touch-manipulation"
        style={{
          paddingBottom: "max(0.35rem, env(safe-area-inset-bottom, 0px))",
        }}
      >
        {/* Nav Bar Container with Curved Scoop Notch */}
        <div className="relative w-full h-[58px]">
          {/* Background Layer: Left Wing + Center SVG Notch + Right Wing */}
          <div className="absolute inset-0 flex items-stretch pointer-events-none">
            {/* Left Wing with Top Border */}
            <div className="flex-1 bg-[#0B100E]/95 backdrop-blur-2xl border-t border-white/[0.08]" />

            {/* Center Notch SVG Cutout */}
            <div className="w-[88px] h-full relative shrink-0">
              <svg
                viewBox="0 0 88 58"
                className="w-[88px] h-[58px] block"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id="hiphimNotchStroke" x1="0" y1="0" x2="88" y2="0" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="rgba(255,255,255,0.08)" />
                    <stop offset="35%" stopColor={currentActiveTab === "/" ? "rgba(32,214,107,0.4)" : "rgba(255,255,255,0.08)"} />
                    <stop offset="50%" stopColor={currentActiveTab === "/" ? "rgba(32,214,107,0.75)" : "rgba(255,255,255,0.12)"} />
                    <stop offset="65%" stopColor={currentActiveTab === "/" ? "rgba(32,214,107,0.4)" : "rgba(255,255,255,0.08)"} />
                    <stop offset="100%" stopColor="rgba(255,255,255,0.08)" />
                  </linearGradient>
                </defs>
                {/* Notch body fill matching bar background */}
                <path
                  d="M 0 0 C 16 0, 24 16, 44 16 C 64 16, 72 0, 88 0 L 88 58 L 0 58 Z"
                  fill="#0B100E"
                  fillOpacity="0.95"
                />
                {/* Notch top contour stroke */}
                <path
                  d="M 0 0 C 16 0, 24 16, 44 16 C 64 16, 72 0, 88 0"
                  fill="none"
                  stroke="url(#hiphimNotchStroke)"
                  strokeWidth="1.2"
                />
              </svg>
            </div>

            {/* Right Wing with Top Border */}
            <div className="flex-1 bg-[#0B100E]/95 backdrop-blur-2xl border-t border-white/[0.08]" />
          </div>

          {/* Additional background extension for safe-area-inset-bottom */}
          <div className="absolute top-[57px] left-0 right-0 -bottom-[env(safe-area-inset-bottom,20px)] bg-[#0B100E]/95 backdrop-blur-2xl pointer-events-none" />

          {/* Interactive Navigation Elements Layer */}
          <div className="relative z-10 w-full h-full flex items-center justify-between px-1">
            {/* Left 2 Items: Chiếu Rạp & Lịch Sử */}
            <div className="flex-1 flex items-center justify-around pr-1 h-full">
              {/* Tab 1: Chiếu Rạp */}
              {(() => {
                const active = currentActiveTab === "chieu-rap";
                return (
                  <Link
                    href="/?typeList=phim-chieu-rap"
                    prefetch={true}
                    onClick={(e) => handleBottomNavNavigate("/?typeList=phim-chieu-rap", e)}
                    className="flex-1 h-full flex flex-col items-center justify-center gap-1 relative select-none touch-manipulation cursor-pointer active:scale-90 transition-transform duration-75 group"
                    style={{ WebkitTapHighlightColor: "transparent" }}
                    aria-label="Chiếu Rạp"
                  >
                    <div className="relative flex items-center justify-center">
                      <Clapperboard
                        className={cn(
                          "w-[19px] h-[19px] transition-colors duration-150",
                          active ? "text-brand-green stroke-[2.4]" : "text-white/50 group-hover:text-white"
                        )}
                      />
                      {active && (
                        <span className="absolute -inset-1.5 rounded-full bg-brand-green/20 blur-sm pointer-events-none" />
                      )}
                    </div>
                    <span
                      className={cn(
                        "text-[9.5px] tracking-tight whitespace-nowrap transition-colors duration-150 leading-none",
                        active ? "text-brand-green font-bold" : "text-white/50 group-hover:text-white font-medium"
                      )}
                    >
                      Chiếu rạp
                    </span>
                  </Link>
                );
              })()}

              {/* Tab 2: Lịch Sử Xem */}
              {(() => {
                const active = currentActiveTab === "/recently";
                return (
                  <Link
                    href="/recently"
                    prefetch={true}
                    onClick={(e) => handleBottomNavNavigate("/recently", e)}
                    className="flex-1 h-full flex flex-col items-center justify-center gap-1 relative select-none touch-manipulation cursor-pointer active:scale-90 transition-transform duration-75 group"
                    style={{ WebkitTapHighlightColor: "transparent" }}
                    aria-label="Lịch Sử Xem"
                  >
                    <div className="relative flex items-center justify-center">
                      <History
                        className={cn(
                          "w-[19px] h-[19px] transition-colors duration-150",
                          active ? "text-brand-green stroke-[2.4]" : "text-white/50 group-hover:text-white"
                        )}
                      />
                      {active && (
                        <span className="absolute -inset-1.5 rounded-full bg-brand-green/20 blur-sm pointer-events-none" />
                      )}
                    </div>
                    <span
                      className={cn(
                        "text-[9.5px] tracking-tight whitespace-nowrap transition-colors duration-150 leading-none",
                        active ? "text-brand-green font-bold" : "text-white/50 group-hover:text-white font-medium"
                      )}
                    >
                      Lịch sử
                    </span>
                  </Link>
                );
              })()}
            </div>

            {/* Center Elevated Action: Home Button */}
            <div className="w-[88px] h-full relative shrink-0 flex items-center justify-center">
              {(() => {
                const active = currentActiveTab === "/";
                return (
                  <Link
                    href="/"
                    prefetch={true}
                    onClick={(e) => handleBottomNavNavigate("/", e)}
                    className="absolute -top-[18px] w-[52px] h-[52px] rounded-full flex items-center justify-center select-none touch-manipulation cursor-pointer active:scale-90 transition-transform duration-100 group"
                    style={{ WebkitTapHighlightColor: "transparent" }}
                    aria-label="Trang Chủ"
                  >
                    {/* Ambient Glow Halo behind Elevated Button */}
                    <div
                      className={cn(
                        "absolute -inset-1.5 rounded-full blur-md transition-opacity duration-300 pointer-events-none",
                        active
                          ? "bg-brand-green/45 opacity-100"
                          : "bg-brand-green/15 opacity-40 group-hover:opacity-80"
                      )}
                    />

                    {/* Elevated Button Body */}
                    <div
                      className={cn(
                        "w-full h-full rounded-full flex items-center justify-center transition-all duration-200 relative overflow-hidden",
                        active
                          ? "bg-gradient-to-tr from-[#20D66B] via-[#2AE376] to-[#10B981] text-black shadow-[0_0_24px_rgba(32,214,107,0.6),0_6px_20px_rgba(0,0,0,0.7)] border-2 border-brand-green"
                          : "bg-[#111915] text-white/70 hover:text-white border border-white/15 hover:border-brand-green/40 shadow-[0_6px_18px_rgba(0,0,0,0.8)]"
                      )}
                    >
                      {/* Top highlight shine on active button */}
                      {active && (
                        <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/35 to-transparent pointer-events-none rounded-t-full" />
                      )}
                      <Home
                        className={cn(
                          "w-[23px] h-[23px] transition-transform group-hover:scale-105",
                          active ? "stroke-[2.5] text-black" : "stroke-[2] text-white/70 group-hover:text-brand-green"
                        )}
                      />
                    </div>
                  </Link>
                );
              })()}
            </div>

            {/* Right 2 Items: Yêu Thích & Tài Khoản */}
            <div className="flex-1 flex items-center justify-around pl-1 h-full">
              {/* Tab 4: Phim Yêu Thích */}
              {(() => {
                const active = currentActiveTab === "/favorites";
                return (
                  <Link
                    href="/favorites"
                    prefetch={true}
                    onClick={(e) => handleBottomNavNavigate("/favorites", e)}
                    className="flex-1 h-full flex flex-col items-center justify-center gap-1 relative select-none touch-manipulation cursor-pointer active:scale-90 transition-transform duration-75 group"
                    style={{ WebkitTapHighlightColor: "transparent" }}
                    aria-label="Phim Yêu Thích"
                  >
                    <div className="relative flex items-center justify-center">
                      <Heart
                        className={cn(
                          "w-[19px] h-[19px] transition-colors duration-150",
                          active
                            ? "text-brand-green fill-brand-green stroke-[2.4]"
                            : "text-white/50 group-hover:text-white"
                        )}
                      />
                      {active && (
                        <span className="absolute -inset-1.5 rounded-full bg-brand-green/20 blur-sm pointer-events-none" />
                      )}
                    </div>
                    <span
                      className={cn(
                        "text-[9.5px] tracking-tight whitespace-nowrap transition-colors duration-150 leading-none",
                        active ? "text-brand-green font-bold" : "text-white/50 group-hover:text-white font-medium"
                      )}
                    >
                      Yêu thích
                    </span>
                  </Link>
                );
              })()}

              {/* Tab 5: Tài Khoản */}
              {(() => {
                const active = currentActiveTab === "account";
                return (
                  <button
                    type="button"
                    onClick={() => {
                      setIsExploreOpen(false);
                      setIsMobileOpen(false);
                      setActiveModal(null);
                      if (user) {
                        setIsAccountOpen((prev) => !prev);
                      } else {
                        openAuthModal("login");
                      }
                    }}
                    className="flex-1 h-full flex flex-col items-center justify-center gap-1 relative select-none touch-manipulation cursor-pointer active:scale-90 transition-transform duration-75 group"
                    style={{ WebkitTapHighlightColor: "transparent" }}
                    aria-label="Tài Khoản"
                  >
                    <div className="relative flex items-center justify-center">
                      {user?.avatar ? (
                        <div
                          className={cn(
                            "w-[21px] h-[21px] rounded-full overflow-hidden shrink-0 border relative transition-colors",
                            active ? "border-brand-green ring-2 ring-brand-green/30" : "border-white/20"
                          )}
                        >
                          <Image src={user.avatar} alt="" fill unoptimized className="object-cover" sizes="21px" />
                        </div>
                      ) : (
                        <User
                          className={cn(
                            "w-[19px] h-[19px] transition-colors duration-150",
                            active ? "text-brand-green stroke-[2.4]" : "text-white/50 group-hover:text-white"
                          )}
                        />
                      )}
                      {active && (
                        <span className="absolute -inset-1.5 rounded-full bg-brand-green/20 blur-sm pointer-events-none" />
                      )}
                    </div>
                    <span
                      className={cn(
                        "text-[9.5px] tracking-tight whitespace-nowrap transition-colors duration-150 leading-none",
                        active ? "text-brand-green font-bold" : "text-white/50 group-hover:text-white font-medium"
                      )}
                    >
                      Tài khoản
                    </span>
                  </button>
                );
              })()}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Account Backdrop */}
      {isAccountOpen && (
        <div
          className="lg:hidden fixed inset-0 z-[120] bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setIsAccountOpen(false)}
        />
      )}

      {/* Mobile Account Floating Sheet */}
      {isAccountOpen && (
        <div
          className="lg:hidden fixed left-1/2 -translate-x-1/2 z-[130] w-[calc(100%-24px)] max-w-[390px] max-h-[calc(100dvh-5.5rem)] overflow-y-auto overscroll-contain bg-[#0B100E]/95 backdrop-blur-2xl border border-white/[0.08] rounded-3xl p-4 shadow-[0_20px_50px_rgba(0,0,0,0.85)] animate-in fade-in slide-in-from-bottom-5 duration-200 pointer-events-auto select-none"
          style={{ bottom: "max(5.25rem, calc(env(safe-area-inset-bottom) + 4.75rem))" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Pill Handle */}
          <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mb-2.5 shrink-0" />

          {user ? (
            <div>
              {/* User Profile Info Card */}
              <div className="flex items-center justify-between pb-2.5 border-b border-white/10 mb-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={cn(
                    "w-9 h-9 sm:w-10 sm:h-10 rounded-2xl font-black text-sm sm:text-base flex items-center justify-center shrink-0 relative",
                    isSuperAdmin
                      ? "bg-gradient-to-tr from-amber-400 via-emerald-400 to-brand-green text-black ring-2 ring-amber-400/60 shadow-[0_0_15px_rgba(251,191,36,0.35)]"
                      : "bg-gradient-to-tr from-brand-green to-emerald-300 text-black shadow-[0_0_12px_rgba(32,214,107,0.4)]"
                  )}>
                    {(user.name || user.email || "U").charAt(0).toUpperCase()}
                    {isSuperAdmin && (
                      <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-400 flex items-center justify-center text-[9px] text-black ring-1.5 ring-[#0d1310]">
                        <Crown className="w-2 h-2 fill-current" />
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs sm:text-sm text-white truncate">{user.name}</span>
                      {isSuperAdmin && (
                        <Crown className="w-3 h-3 text-amber-400 shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-white/50 truncate font-mono mt-0.5">{user.email}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAccountOpen(false)}
                  className="p-1.5 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
                  aria-label="Đóng"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>

              {/* Super Admin Control Center Hub */}
              {isSuperAdmin && (
                <div className="mb-2.5 p-2.5 sm:p-3 rounded-2xl bg-gradient-to-br from-emerald-950/70 via-[#0c140f] to-black border border-emerald-500/35 shadow-[0_4px_25px_rgba(0,0,0,0.6),0_0_20px_rgba(34,197,94,0.15)] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-emerald-400/90 uppercase tracking-wider flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-emerald-400" />
                      Bảng Điều Hành Quản Trị
                    </span>
                  </div>

                  {/* Master Button to Admin */}
                  <Link
                    href="/admin"
                    onClick={() => setIsAccountOpen(false)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-500/25 via-brand-green/30 to-emerald-500/25 hover:from-emerald-500/35 hover:to-brand-green/40 border border-emerald-400/40 shadow-[0_0_15px_rgba(34,197,94,0.2)] transition-all group cursor-pointer active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-5 h-5 rounded-md bg-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform shrink-0">
                        <Shield className="w-3 h-3" />
                      </div>
                      <div className="min-w-0 text-left">
                        <p className="font-black text-xs text-white group-hover:text-emerald-300 transition-colors truncate">
                          Mở Trang Quản Trị Hệ Thống
                        </p>
                        <p className="text-[9.5px] text-white/60 font-normal truncate">Quản trị toàn quyền website</p>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-emerald-400 group-hover:translate-x-1 transition-transform shrink-0 ml-1" />
                  </Link>

                  {/* 3 Quick Navigation Shortcuts */}
                  <div className="grid grid-cols-3 gap-1 pt-0.5">
                    <Link
                      href="/admin?tab=users"
                      onClick={() => setIsAccountOpen(false)}
                      className="flex flex-col items-center gap-1 py-1.5 px-1 rounded-xl bg-white/[0.04] hover:bg-emerald-500/10 border border-white/5 hover:border-emerald-500/30 text-white/80 hover:text-white transition-all text-center group cursor-pointer"
                    >
                      <Users className="w-3 h-3 text-emerald-400 group-hover:scale-110 transition-transform" />
                      <span className="text-[9.5px] font-semibold">Thành Viên</span>
                    </Link>

                    <Link
                      href="/admin?tab=featured"
                      onClick={() => setIsAccountOpen(false)}
                      className="flex flex-col items-center gap-1 py-1.5 px-1 rounded-xl bg-white/[0.04] hover:bg-amber-500/10 border border-white/5 hover:border-amber-500/30 text-white/80 hover:text-white transition-all text-center group cursor-pointer"
                    >
                      <Film className="w-3 h-3 text-amber-400 group-hover:scale-110 transition-transform" />
                      <span className="text-[9.5px] font-semibold">Ghim Phim</span>
                    </Link>

                    <Link
                      href="/admin?tab=settings"
                      onClick={() => setIsAccountOpen(false)}
                      className="flex flex-col items-center gap-1 py-1.5 px-1 rounded-xl bg-white/[0.04] hover:bg-sky-500/10 border border-white/5 hover:border-sky-500/30 text-white/80 hover:text-white transition-all text-center group cursor-pointer"
                    >
                      <Settings className="w-3 h-3 text-sky-400 group-hover:scale-110 transition-transform" />
                      <span className="text-[9.5px] font-semibold">Cấu Hình</span>
                    </Link>
                  </div>
                </div>
              )}

              {/* Action Links */}
              <div className="space-y-0.5">
                <Link
                  href="/favorites"
                  onClick={() => setIsAccountOpen(false)}
                  className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-white/90 hover:text-white hover:bg-white/[0.08] transition-colors group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center text-white/70 group-hover:text-red-400 group-hover:bg-red-500/10 transition-colors">
                      <Heart className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-semibold">Phim Yêu Thích</span>
                  </div>
                  <span className="text-[9.5px] px-2 py-0.5 rounded-full bg-white/5 text-white/60 font-mono">
                    Đồng bộ
                  </span>
                </Link>

                <Link
                  href="/recently"
                  onClick={() => setIsAccountOpen(false)}
                  className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-white/90 hover:text-white hover:bg-white/[0.08] transition-colors group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center text-white/70 group-hover:text-brand-green group-hover:bg-brand-green/10 transition-colors">
                      <History className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-semibold">Lịch Sử Xem</span>
                  </div>
                  <span className="text-[9.5px] px-2 py-0.5 rounded-full bg-white/5 text-white/60 font-mono">
                    Đồng bộ
                  </span>
                </Link>

                <button
                  type="button"
                  onClick={handleManualSync}
                  disabled={isSyncing}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-white/90 hover:text-white hover:bg-white/[0.08] transition-colors group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center text-white/70 group-hover:text-brand-green group-hover:bg-brand-green/10 transition-colors">
                      <RefreshCw className={cn("w-3.5 h-3.5", isSyncing && "animate-spin text-brand-green")} />
                    </div>
                    <span className="font-semibold">Đồng Bộ Ngay</span>
                  </div>
                  <span className="text-[9.5px] text-brand-green font-mono">
                    {isSyncing ? "Đang lưu..." : "Sẵn sàng"}
                  </span>
                </button>
              </div>

              <div className="border-t border-white/10 my-1.5" />

              {/* Logout Button */}
              <button
                type="button"
                onClick={async () => {
                  setIsAccountOpen(false);
                  await logout();
                  if (typeof window !== "undefined" && window.location.pathname.startsWith("/admin")) {
                    window.location.href = "/";
                  }
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Đăng Xuất</span>
              </button>
            </div>
          ) : (
            <div>
              {/* Not Logged In View */}
              <div className="flex items-center justify-between pb-2.5 border-b border-white/10 mb-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-2xl bg-brand-green/15 border border-brand-green/30 flex items-center justify-center text-brand-green shadow-[0_0_15px_rgba(32,214,107,0.2)]">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-white">Tài Khoản Hi Phim</h3>
                    <p className="text-[10px] sm:text-[11px] text-white/50">Trải nghiệm xem phim riêng tư</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAccountOpen(false)}
                  className="p-1.5 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  aria-label="Đóng"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>

              <p className="text-xs text-white/70 mb-3 leading-relaxed">
                Đăng nhập để lưu lịch sử xem phim và đồng bộ danh sách phim yêu thích xuyên suốt mọi thiết bị.
              </p>

              <div className="grid grid-cols-2 gap-2 mb-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsAccountOpen(false);
                    openAuthModal("login");
                  }}
                  className="h-9 sm:h-10 rounded-xl bg-brand-green hover:bg-brand-green-hover text-black font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-[0_0_20px_rgba(32,214,107,0.35)] active:scale-95 transition-all cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  Đăng Nhập
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAccountOpen(false);
                    openAuthModal("register");
                  }}
                  className="h-9 sm:h-10 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs border border-white/15 active:scale-95 transition-all cursor-pointer"
                >
                  Đăng Ký
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-[120] bg-black/75"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsMobileOpen(false);
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
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
        {/* Sidebar Header / Brand Name */}
        <div className="h-16 lg:h-14 px-4 flex items-center justify-between border-b border-white/8 shrink-0">
          <Link href="/" className="flex items-center select-none py-1 group" aria-label="Về trang chủ Hi Phim">
            <BrandLogo size="md" />
          </Link>

          {/* Close Button — Mobile */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsMobileOpen(false);
            }}
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
                  scroll={false}
                  prefetch={true}
                  onClick={() => {
                    setIsMobileOpen(false);
                    navigateToTab(item.href);
                  }}
                  onMouseEnter={() => {
                    if (item.typeList) instantMovieStore.prefetch(item.typeList);
                  }}
                  onTouchStart={() => {
                    if (item.typeList) instantMovieStore.prefetch(item.typeList);
                  }}
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
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setActiveModal("categories");
              }}
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
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setActiveModal("countries");
              }}
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
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setActiveModal("years");
              }}
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
              const active = currentActiveTab === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={true}
                  onClick={() => {
                    setIsMobileOpen(false);
                    navigateToTab(item.href);
                  }}
                  className={cn(
                    "w-full relative flex items-center gap-3 lg:gap-2 px-3 lg:px-2 py-2 lg:py-1.5 rounded-xl text-sm lg:text-[13px] font-medium lg:font-semibold transition-all duration-150 group overflow-hidden text-left cursor-pointer",
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
      {/* KHÁM PHÁ BOTTOM SHEET MENU (ONFLIX STYLE) - MOBILE ONLY */}
      {/* ======================================================== */}
      <MobileExploreSheet
        isOpen={isExploreOpen}
        onClose={() => setIsExploreOpen(false)}
        onOpenCategories={() => {
          setIsExploreOpen(false);
          setActiveModal("categories");
        }}
        onOpenCountries={() => {
          setIsExploreOpen(false);
          setActiveModal("countries");
        }}
        onOpenYears={() => {
          setIsExploreOpen(false);
          setActiveModal("years");
        }}
        categoriesCount={categories.length}
        countriesCount={countries.length}
      />

      {/* ======================================================== */}
      {/* MODAL BẢNG CHỌN THỂ LOẠI (CATEGORY SELECTION BOARD) */}
      {/* ======================================================== */}
      {activeModal === "categories" && (
        <div
          className={cn(
            "fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 lg:p-6 transition-opacity duration-150 select-none",
            isClosing ? "opacity-0 pointer-events-none" : "opacity-100 animate-in fade-in duration-200"
          )}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          {/* Backdrop with Cinema Blur */}
          <div
            className="fixed inset-0 bg-black/85 backdrop-blur-md cursor-pointer transition-opacity"
            onClick={closeModal}
            onTouchEnd={closeModal}
          />

          {/* Modal Content Board (Bottom Sheet on Mobile, Centered on Desktop) */}
          <div
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "relative z-10 w-full sm:max-w-3xl lg:max-w-4xl max-h-[88dvh] sm:max-h-[84vh] bg-[#0c120e]/95 backdrop-blur-2xl border-t sm:border border-emerald-500/20 rounded-t-[28px] sm:rounded-[28px] p-4 sm:p-6 flex flex-col shadow-[0_25px_70px_rgba(0,0,0,0.95),0_0_40px_rgba(32,214,107,0.06)] overflow-hidden transform-gpu",
              isClosing ? "scale-95 opacity-0 duration-150" : "animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200"
            )}
          >
            {/* Top Ambient Glow Line */}
            <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-brand-green/40 to-transparent pointer-events-none" />

            {/* Mobile Sheet Handle Bar */}
            <div className="sm:hidden w-12 h-1 bg-white/20 hover:bg-white/30 rounded-full mx-auto mb-3 shrink-0" />

            {/* Modal Header */}
            <div className="relative z-10 flex items-center justify-between pb-3 sm:pb-4 border-b border-white/[0.08] shrink-0 gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-brand-green/15 border border-brand-green/30 flex items-center justify-center text-brand-green shrink-0 shadow-[0_0_15px_rgba(32,214,107,0.18)]">
                  <Layers className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-xl font-extrabold text-white tracking-tight truncate">
                      Tất Cả Thể Loại
                    </h3>
                    <span className="text-[10px] sm:text-[11px] font-mono font-bold text-brand-green bg-brand-green/10 border border-brand-green/25 px-2.5 py-0.5 rounded-full shrink-0">
                      {categories.length} THỂ LOẠI
                    </span>
                  </div>
                  <p className="hidden sm:block text-[11px] text-white/40 mt-0.5">
                    Khám phá kho phim phong phú theo thể loại yêu thích của bạn
                  </p>
                </div>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={closeModal}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/5 hover:bg-white/10 active:scale-90 border border-white/10 flex items-center justify-center text-white/70 hover:text-white transition-all shrink-0 cursor-pointer"
                aria-label="Đóng bảng"
              >
                <X className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              </button>
            </div>

            {/* Quick Filter Search Box */}
            <div className="relative z-10 my-3 shrink-0">
              <div className="relative flex items-center">
                <Search className="w-4 h-4 absolute left-3.5 text-emerald-400/60 pointer-events-none" />
                <input
                  type="text"
                  aria-label="Lọc thể loại phim"
                  value={categorySearchQuery}
                  onChange={(e) => setCategorySearchQuery(e.target.value)}
                  placeholder="Lọc nhanh thể loại (Hành động, Cổ trang, Kinh dị, Hoạt hình...)"
                  className="w-full bg-white/[0.04] hover:bg-white/[0.06] focus:bg-white/[0.08] border border-white/10 focus:border-brand-green/50 text-white placeholder-white/35 text-[15px] sm:text-sm rounded-xl sm:rounded-2xl pl-10 pr-9 py-2.5 outline-none transition-all duration-200 shadow-inner"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                />
                {categorySearchQuery && (
                  <button
                    type="button"
                    onClick={() => setCategorySearchQuery("")}
                    aria-label="Xóa tìm kiếm"
                    className="absolute right-2.5 p-1 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Categories Interactive Grid */}
            <div
              ref={categoriesScrollRef}
              className="relative z-10 flex-1 overflow-y-auto pr-1 modal-scroll custom-scrollbar overscroll-contain -webkit-overflow-scrolling-touch"
            >
              {filteredCategories.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-2.5 pb-4">
                  {filteredCategories.map((cat, idx) => {
                    const active = currentCategory === cat.slug;
                    return (
                      <button
                        key={`${cat.slug}-${idx}`}
                        type="button"
                        onClick={(e) => handleSelectCategory(cat.slug, e)}
                        className={cn(
                          "relative flex items-center justify-between p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border text-left transition-all duration-200 group active:scale-95 min-w-0 shadow-none",
                          active
                            ? "bg-brand-green text-black border-brand-green font-extrabold shadow-[0_0_20px_rgba(32,214,107,0.35)] scale-[1.02]"
                            : "bg-white/[0.03] hover:bg-white/[0.08] border-white/[0.06] hover:border-brand-green/40 text-white/80 hover:text-white"
                        )}
                      >
                        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 truncate">
                          <span
                            className={cn(
                              "w-1.5 h-1.5 rounded-full shrink-0 transition-all",
                              active
                                ? "bg-black scale-125"
                                : "bg-white/25 group-hover:bg-brand-green group-hover:scale-125"
                            )}
                          />
                          <span className={cn("text-xs sm:text-sm truncate", active ? "font-black" : "font-semibold")}>
                            {cat.name}
                          </span>
                        </div>
                        {active ? (
                          <Check className="w-4 h-4 text-black shrink-0 ml-1.5 stroke-[2.5]" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5 text-white/20 group-hover:text-brand-green group-hover:translate-x-0.5 transition-all shrink-0 ml-1 hidden sm:block opacity-0 group-hover:opacity-100" />
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
            <div className="relative z-10 pt-3 mt-1.5 border-t border-white/[0.08] flex items-center justify-between text-xs text-white/50 shrink-0 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
              <div className="flex items-center gap-2 min-w-0">
                {currentCategory ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      startTransition(() => {
                        router.push("/", { scroll: false });
                      });
                      closeModal();
                    }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/25 transition-colors font-medium text-[11px]"
                  >
                    <X className="w-3 h-3" />
                    <span>Bỏ chọn ({activeCategoryObj?.name || currentCategory})</span>
                  </button>
                ) : (
                  <span className="truncate text-white/40 text-[11px] sm:text-xs">
                    Bấm vào thể loại để lọc phim tức thì
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  closeModal();
                  router.push("/");
                }}
                className="text-brand-green hover:underline font-semibold shrink-0 text-[11px] sm:text-xs"
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
        <div
          className={cn(
            "fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 lg:p-6 transition-opacity duration-150 select-none",
            isClosing ? "opacity-0 pointer-events-none" : "opacity-100 animate-in fade-in duration-200"
          )}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          {/* Backdrop with Cinema Blur */}
          <div
            className="fixed inset-0 bg-black/85 backdrop-blur-md cursor-pointer transition-opacity"
            onClick={closeModal}
            onTouchEnd={closeModal}
          />

          {/* Modal Content Board (Bottom Sheet on Mobile, Centered on Desktop) */}
          <div
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "relative z-10 w-full sm:max-w-3xl lg:max-w-4xl max-h-[88dvh] sm:max-h-[84vh] bg-[#0c120e]/95 backdrop-blur-2xl border-t sm:border border-emerald-500/20 rounded-t-[28px] sm:rounded-[28px] p-4 sm:p-6 flex flex-col shadow-[0_25px_70px_rgba(0,0,0,0.95),0_0_40px_rgba(32,214,107,0.06)] overflow-hidden transform-gpu",
              isClosing ? "scale-95 opacity-0 duration-150" : "animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200"
            )}
          >
            {/* Top Ambient Glow Line */}
            <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-brand-green/40 to-transparent pointer-events-none" />

            {/* Mobile Sheet Handle Bar */}
            <div className="sm:hidden w-12 h-1 bg-white/20 hover:bg-white/30 rounded-full mx-auto mb-3 shrink-0" />

            {/* Modal Header */}
            <div className="relative z-10 flex items-center justify-between pb-3 sm:pb-4 border-b border-white/[0.08] shrink-0 gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-brand-green/15 border border-brand-green/30 flex items-center justify-center text-brand-green shrink-0 shadow-[0_0_15px_rgba(32,214,107,0.18)]">
                  <Globe className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-xl font-extrabold text-white tracking-tight truncate">
                      Quốc Gia Điện Ảnh
                    </h3>
                    <span className="text-[10px] sm:text-[11px] font-mono font-bold text-brand-green bg-brand-green/10 border border-brand-green/25 px-2.5 py-0.5 rounded-full shrink-0">
                      {countries.length || "TOÀN CẦU"} QUỐC GIA
                    </span>
                  </div>
                  <p className="hidden sm:block text-[11px] text-white/40 mt-0.5">
                    Lọc điện ảnh theo nền văn hóa và xuất xứ phim
                  </p>
                </div>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={closeModal}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/5 hover:bg-white/10 active:scale-90 border border-white/10 flex items-center justify-center text-white/70 hover:text-white transition-all shrink-0 cursor-pointer"
                aria-label="Đóng bảng"
              >
                <X className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              </button>
            </div>

            {/* Quick Filter Search Box */}
            <div className="relative z-10 my-3 shrink-0">
              <div className="relative flex items-center">
                <Search className="w-4 h-4 absolute left-3.5 text-emerald-400/60 pointer-events-none" />
                <input
                  type="text"
                  aria-label="Lọc quốc gia phim"
                  value={countrySearchQuery}
                  onChange={(e) => setCountrySearchQuery(e.target.value)}
                  placeholder="Lọc nhanh quốc gia (Hàn Quốc, Trung Quốc, Âu Mỹ, Nhật Bản...)"
                  className="w-full bg-white/[0.04] hover:bg-white/[0.06] focus:bg-white/[0.08] border border-white/10 focus:border-brand-green/50 text-white placeholder-white/35 text-[15px] sm:text-sm rounded-xl sm:rounded-2xl pl-10 pr-9 py-2.5 outline-none transition-all duration-200 shadow-inner"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                />
                {countrySearchQuery && (
                  <button
                    type="button"
                    onClick={() => setCountrySearchQuery("")}
                    aria-label="Xóa tìm kiếm"
                    className="absolute right-2.5 p-1 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Countries Interactive Content */}
            <div
              ref={countriesScrollRef}
              className="relative z-10 flex-1 overflow-y-auto pr-1 modal-scroll custom-scrollbar space-y-4 overscroll-contain -webkit-overflow-scrolling-touch"
            >
              {!countrySearchQuery.trim() && (
                <div>
                  <span className="text-[10px] sm:text-[11px] font-bold text-emerald-400/80 uppercase tracking-widest block mb-2 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-green animate-pulse" />
                    Quốc Gia Nổi Bật
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
                    {sortedCountries.slice(0, 8).map((c) => {
                      const active = currentCountry === c.slug;
                      const code = c.code || getCountryCode(c.slug) || getCountryCode(c.name);
                      return (
                        <button
                          key={c.slug}
                          type="button"
                          onClick={(e) => handleSelectCountry(c.slug, e)}
                          className={cn(
                            "relative p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border text-center transition-all duration-200 group flex items-center justify-start gap-2.5 active:scale-95 min-w-0 shadow-none",
                            active
                              ? "bg-brand-green text-black border-brand-green font-extrabold shadow-[0_0_18px_rgba(32,214,107,0.35)] scale-[1.02]"
                              : "bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.08] hover:border-brand-green/40 text-white/90 hover:text-white"
                          )}
                        >
                          {(!code || code === "WW") ? (
                            <Globe className={cn("w-5 h-5 shrink-0 transition-transform group-hover:scale-110", active ? "text-black" : "text-brand-green")} />
                          ) : (
                            <img
                              src={`https://flagcdn.com/w80/${code.toLowerCase()}.png`}
                              alt={c.name}
                              loading="lazy"
                              className="w-6 sm:w-7 h-4 sm:h-4.5 object-cover rounded-[3px] border border-white/10 shrink-0 group-hover:scale-110 transition-transform"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          )}
                          <span className={cn("text-xs sm:text-sm truncate text-left", active ? "font-black" : "font-bold")}>
                            {c.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <span className="text-[10px] sm:text-[11px] font-bold text-white/40 uppercase tracking-widest block mb-2 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
                  {countrySearchQuery.trim() ? "Kết Quả Tìm Kiếm" : "Tất Cả Quốc Gia"}
                </span>

                {filteredCountries.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 pb-4">
                    {filteredCountries.map((c) => {
                      const active = currentCountry === c.slug;
                      const code = c.code || getCountryCode(c.slug) || getCountryCode(c.name);
                      return (
                        <button
                          key={c.slug}
                          type="button"
                          onClick={(e) => handleSelectCountry(c.slug, e)}
                          className={cn(
                            "relative flex items-center justify-between p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border text-left transition-all duration-200 group active:scale-95 min-w-0 shadow-none",
                            active
                              ? "bg-brand-green text-black border-brand-green font-extrabold shadow-[0_0_18px_rgba(32,214,107,0.35)] scale-[1.02]"
                              : "bg-white/[0.03] hover:bg-white/[0.07] border-white/[0.06] hover:border-brand-green/30 text-white/80 hover:text-white"
                          )}
                        >
                          <div className="flex items-center gap-2 min-w-0 truncate">
                            {(!code || code === "WW") ? (
                              <Globe className={cn("w-4 h-4 shrink-0", active ? "text-black" : "text-white/40 group-hover:text-brand-green")} />
                            ) : (
                              <img
                                src={`https://flagcdn.com/w40/${code.toLowerCase()}.png`}
                                alt={c.name}
                                loading="lazy"
                                className="w-5 h-3.5 object-cover rounded-[2px] border border-white/10 shrink-0 opacity-80 group-hover:opacity-100"
                                onError={(e) => {
                                  e.currentTarget.style.display = "none";
                                }}
                              />
                            )}
                            <span className={cn("text-xs truncate", active ? "font-black" : "font-medium")}>
                              {c.name}
                            </span>
                          </div>
                          {active && (
                            <Check className="w-3.5 h-3.5 text-black shrink-0 ml-1 stroke-[2.5]" />
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
            <div className="relative z-10 pt-3 mt-1.5 border-t border-white/[0.08] flex items-center justify-between text-xs text-white/50 shrink-0 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
              <div className="flex items-center gap-2 min-w-0">
                {currentCountry ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      startTransition(() => {
                        router.push("/", { scroll: false });
                      });
                      closeModal();
                    }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/25 transition-colors font-medium text-[11px]"
                  >
                    <X className="w-3 h-3" />
                    <span>Bỏ chọn ({activeCountryObj?.name || currentCountry})</span>
                  </button>
                ) : (
                  <span className="truncate text-white/40 text-[11px] sm:text-xs">
                    Bấm vào quốc gia để lọc phim tức thì
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  closeModal();
                  router.push("/");
                }}
                className="text-brand-green hover:underline font-semibold shrink-0 text-[11px] sm:text-xs"
              >
                Xem tất cả phim
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ======================================================== */}
      {/* MODAL BẢNG CHỌN NĂM PHÁT HÀNH (YEAR SELECTION BOARD) */}
      {/* ======================================================== */}
      {activeModal === "years" && (
        <div
          className={cn(
            "fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 lg:p-6 transition-opacity duration-150 select-none",
            isClosing ? "opacity-0 pointer-events-none" : "opacity-100 animate-in fade-in duration-200"
          )}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          {/* Backdrop with Cinema Blur */}
          <div
            className="fixed inset-0 bg-black/85 backdrop-blur-md cursor-pointer transition-opacity"
            onClick={closeModal}
            onTouchEnd={closeModal}
          />

          {/* Modal Content Board (Bottom Sheet on Mobile, Centered on Desktop) */}
          <div
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "relative z-10 w-full sm:max-w-3xl lg:max-w-4xl max-h-[88dvh] sm:max-h-[84vh] bg-[#0c120e]/95 backdrop-blur-2xl border-t sm:border border-emerald-500/20 rounded-t-[28px] sm:rounded-[28px] p-4 sm:p-6 flex flex-col shadow-[0_25px_70px_rgba(0,0,0,0.95),0_0_40px_rgba(32,214,107,0.06)] overflow-hidden transform-gpu",
              isClosing ? "scale-95 opacity-0 duration-150" : "animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200"
            )}
          >
            {/* Top Ambient Glow Line */}
            <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-brand-green/40 to-transparent pointer-events-none" />

            {/* Mobile Sheet Handle Bar */}
            <div className="sm:hidden w-12 h-1 bg-white/20 hover:bg-white/30 rounded-full mx-auto mb-3 shrink-0" />

            {/* Modal Header */}
            <div className="relative z-10 flex items-center justify-between pb-3 sm:pb-4 border-b border-white/[0.08] shrink-0 gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-brand-green/15 border border-brand-green/30 flex items-center justify-center text-brand-green shrink-0 shadow-[0_0_15px_rgba(32,214,107,0.18)]">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-xl font-extrabold text-white tracking-tight truncate">
                      Năm Phát Hành
                    </h3>
                    <span className="text-[10px] sm:text-[11px] font-mono font-bold text-brand-green bg-brand-green/10 border border-brand-green/25 px-2 py-0.5 rounded-full shrink-0">
                      1980 - {currentYearNum}
                    </span>
                  </div>
                  <p className="hidden sm:block text-[11px] text-white/40 mt-0.5">
                    Lọc phim theo từng mốc thời gian và thập niên điện ảnh
                  </p>
                </div>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={closeModal}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/5 hover:bg-white/10 active:scale-90 border border-white/10 flex items-center justify-center text-white/70 hover:text-white transition-all shrink-0 cursor-pointer"
                aria-label="Đóng bảng"
              >
                <X className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              </button>
            </div>

            {/* Quick Filter Search Box */}
            <div className="relative z-10 my-3 shrink-0">
              <div className="relative flex items-center">
                <Search className="w-4 h-4 absolute left-3.5 text-emerald-400/60 pointer-events-none" />
                <input
                  type="text"
                  aria-label="Lọc năm phát hành phim"
                  value={yearSearchQuery}
                  onChange={(e) => setYearSearchQuery(e.target.value)}
                  placeholder="Lọc nhanh năm (2026, 2025, 2024, 2020...)"
                  className="w-full bg-white/[0.04] hover:bg-white/[0.06] focus:bg-white/[0.08] border border-white/10 focus:border-brand-green/50 text-white placeholder-white/35 text-[15px] sm:text-sm rounded-xl sm:rounded-2xl pl-10 pr-9 py-2.5 outline-none transition-all duration-200 shadow-inner"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                />
                {yearSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setYearSearchQuery("")}
                    aria-label="Xóa tìm kiếm"
                    className="absolute right-2.5 p-1 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Decade Quick-Filter Pills (Shown when not searching) */}
            {!yearSearchQuery.trim() && (
              <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar-hidden pb-2.5 shrink-0 select-none">
                {[
                  { id: "all", label: "Tất cả các năm" },
                  { id: "2020s", label: "2020 - Nay" },
                  { id: "2010s", label: "2010 - 2019" },
                  { id: "2000s", label: "2000 - 2009" },
                  { id: "classic", label: "Trước 2000" },
                ].map((tab) => {
                  const isTabActive = yearDecade === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setYearDecade(tab.id as any)}
                      className={cn(
                        "px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-150 border shrink-0",
                        isTabActive
                          ? "bg-brand-green text-black border-brand-green font-bold shadow-[0_0_12px_rgba(32,214,107,0.3)]"
                          : "bg-white/[0.03] hover:bg-white/[0.06] text-white/70 hover:text-white border-white/[0.08]"
                      )}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Years Interactive Unified Grid (NO duplicate sections, NO blocking buttons) */}
            <div
              ref={yearsScrollRef}
              className="relative z-10 flex-1 overflow-y-auto pr-1 modal-scroll custom-scrollbar overscroll-contain -webkit-overflow-scrolling-touch"
            >
              {displayedYears.length > 0 ? (
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 sm:gap-2.5 pb-4">
                  {displayedYears.map((y) => {
                    const active = currentYear === String(y);
                    const isLatest = y >= currentYearNum - 1; // e.g. 2025, 2026
                    return (
                      <button
                        key={y}
                        type="button"
                        onClick={(e) => handleSelectYear(y, e)}
                        className={cn(
                          "relative py-2.5 sm:py-3 px-2 rounded-xl sm:rounded-2xl border text-center transition-all duration-200 group active:scale-95 min-w-0 flex flex-col items-center justify-center gap-0.5",
                          active
                            ? "bg-brand-green text-black border-brand-green font-black shadow-[0_0_20px_rgba(32,214,107,0.4)] scale-105 z-10"
                            : isLatest
                            ? "bg-emerald-500/[0.08] hover:bg-emerald-500/[0.18] border-emerald-500/30 hover:border-brand-green text-white font-bold"
                            : "bg-white/[0.03] hover:bg-white/[0.08] border-white/[0.06] hover:border-brand-green/40 text-white/80 hover:text-white font-semibold"
                        )}
                      >
                        {/* Subtle pulse dot for latest years when not active */}
                        {isLatest && !active && (
                          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-brand-green shadow-[0_0_6px_rgba(32,214,107,0.8)] animate-pulse" />
                        )}

                        <span className="text-xs sm:text-sm tracking-tight font-semibold">
                          {y}
                        </span>

                        {active ? (
                          <span className="text-[9px] sm:text-[10px] font-bold text-black flex items-center gap-0.5">
                            <Check className="w-2.5 h-2.5 stroke-[3]" /> Chọn
                          </span>
                        ) : isLatest ? (
                          <span className="text-[9px] text-brand-green font-mono font-medium">
                            Mới
                          </span>
                        ) : null}
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

            {/* Modal Bottom Action / Hint */}
            <div className="relative z-10 pt-3 mt-1.5 border-t border-white/[0.08] flex items-center justify-between text-xs text-white/50 shrink-0 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
              <div className="flex items-center gap-2 min-w-0">
                {currentYear ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      startTransition(() => {
                        router.push("/", { scroll: false });
                      });
                      closeModal();
                    }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/25 transition-colors font-medium text-[11px]"
                  >
                    <X className="w-3 h-3" />
                    <span>Bỏ chọn (Năm {currentYear})</span>
                  </button>
                ) : (
                  <span className="truncate text-white/40 text-[11px] sm:text-xs">
                    Bấm vào năm để lọc phim tức thì
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  closeModal();
                  router.push("/");
                }}
                className="text-brand-green hover:underline font-semibold shrink-0 text-[11px] sm:text-xs"
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

const MemoizedSidebarContent = memo(SidebarContent);

export default function Sidebar(props: SidebarProps) {
  return (
    <Suspense fallback={null}>
      <MemoizedSidebarContent {...props} />
    </Suspense>
  );
}
