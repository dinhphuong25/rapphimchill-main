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
  Smartphone,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { sortCountriesByPopularity, getCountryCode, POPULAR_COUNTRIES } from "@/lib/countries";
import { getCategoryEmoji, sortCategoriesByPopularity, POPULAR_CATEGORIES } from "@/lib/categories";
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
  const [isPlayerFullscreen, setIsPlayerFullscreen] = useState(false);

  useEffect(() => {
    const handleFs = (e: any) => {
      setIsPlayerFullscreen(!!e.detail?.isFullscreen);
    };
    window.addEventListener('video-fullscreen-change', handleFs);
    return () => window.removeEventListener('video-fullscreen-change', handleFs);
  }, []);

  // Active selection modal: 'categories' | 'countries' | 'years' | null
  const [activeModal, setActiveModal] = useState<"categories" | "countries" | "years" | null>(null);
  const [categorySearchQuery, setCategorySearchQuery] = useState("");
  const [countrySearchQuery, setCountrySearchQuery] = useState("");
  const [yearSearchQuery, setYearSearchQuery] = useState("");
  const [yearDecade, setYearDecade] = useState<"all" | "2020s" | "2010s" | "2000s" | "classic">("all");
  const [categoryThematicFilter, setCategoryThematicFilter] = useState<"all" | "popular" | "action" | "romance" | "anime">("all");
  const [countryRegionFilter, setCountryRegionFilter] = useState<"all" | "popular" | "asia" | "west">("all");

  // Listen for open/toggle explore events from mobile header Menu button
  useEffect(() => {
    const handleOpenExplore = () => {
      setIsExploreOpen(true);
      setIsMobileOpen(false);
      setIsAccountOpen(false);
      setActiveModal(null);
    };
    const handleToggleExplore = () => {
      setIsExploreOpen((prev) => {
        const next = !prev;
        if (next) {
          setIsMobileOpen(false);
          setIsAccountOpen(false);
          setActiveModal(null);
        }
        return next;
      });
    };
    window.addEventListener("open-mobile-explore", handleOpenExplore);
    window.addEventListener("toggle-mobile-explore", handleToggleExplore);
    return () => {
      window.removeEventListener("open-mobile-explore", handleOpenExplore);
      window.removeEventListener("toggle-mobile-explore", handleToggleExplore);
    };
  }, []);

  // Broadcast explore state changes to sync with mobile header Menu button
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("mobile-explore-state", { detail: { isOpen: isExploreOpen } })
      );
    }
  }, [isExploreOpen]);

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
    setCategoryThematicFilter("all");
    setCountryRegionFilter("all");
  }, [pathname, searchParams]);

  // Prefetch mobile bottom nav routes for instant 0ms transition on single tap
  useEffect(() => {
    router.prefetch("/");
    router.prefetch("/tai-app");
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
    setYearDecade("all");
    setCategoryThematicFilter("all");
    setCountryRegionFilter("all");

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
    if (currentTypeList === "phim-chieu-rap" || activeTab === "/?typeList=phim-chieu-rap") {
      return "cinema";
    }
    if (pathname === "/recently" || activeTab === "/recently") return "/recently";
    if (pathname === "/favorites" || activeTab === "/favorites") return "/favorites";
    if (pathname === "/tai-app" || activeTab === "/tai-app") return "/tai-app";
    if (activeTab) return activeTab;
    if (pathname === "/" && !hasActiveFilters) return "/";
    return null;
  }, [isAccountOpen, currentTypeList, activeTab, pathname, hasActiveFilters]);

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

  const displayedCategories = useMemo(() => {
    if (categorySearchQuery.trim()) return filteredCategories;
    if (categoryThematicFilter === "popular") {
      const popularSlugs = new Set(["hanh-dong", "co-trang", "tinh-cam", "kinh-di", "hai-huoc", "vien-tuong", "hoat-hinh", "tam-ly", "vo-thuat", "hinh-su", "phieu-luu", "gia-dinh"]);
      return categories.filter((c) => popularSlugs.has(c.slug));
    }
    if (categoryThematicFilter === "action") {
      const slugs = new Set(["hanh-dong", "vo-thuat", "vien-tuong", "khoa-hoc-vien-tuong", "hinh-su", "phieu-luu", "chien-tranh", "gay-can", "kich-tinh", "kinh-di"]);
      return categories.filter((c) => slugs.has(c.slug) || c.name.toLowerCase().includes("hành động") || c.name.toLowerCase().includes("võ thuật"));
    }
    if (categoryThematicFilter === "romance") {
      const slugs = new Set(["tinh-cam", "co-trang", "tam-ly", "gia-dinh", "hoc-duong", "hai-huoc", "am-nhac", "chinh-kich"]);
      return categories.filter((c) => slugs.has(c.slug) || c.name.toLowerCase().includes("tình cảm") || c.name.toLowerCase().includes("cổ trang"));
    }
    if (categoryThematicFilter === "anime") {
      const slugs = new Set(["hoat-hinh", "anime", "than-thoai", "bi-an", "tai-lieu", "the-thao", "lich-su", "mien-tay", "phim-18"]);
      return categories.filter((c) => slugs.has(c.slug) || c.name.toLowerCase().includes("hoạt hình") || c.name.toLowerCase().includes("thần thoại"));
    }
    return categories;
  }, [categories, categorySearchQuery, filteredCategories, categoryThematicFilter]);

  const filteredCountries = useMemo(() => {
    if (!countrySearchQuery.trim()) return sortedCountries;
    return sortedCountries.filter((c) =>
      c.name.toLowerCase().includes(countrySearchQuery.toLowerCase())
    );
  }, [sortedCountries, countrySearchQuery]);

  const displayedCountries = useMemo(() => {
    if (countrySearchQuery.trim()) return filteredCountries;
    if (countryRegionFilter === "popular") {
      const popularSlugs = new Set(["trung-quoc", "han-quoc", "au-my", "nhat-ban", "thai-lan", "viet-nam", "hong-kong", "an-do", "dai-loan", "phap", "anh", "duc"]);
      return sortedCountries.filter((c) => popularSlugs.has(c.slug));
    }
    if (countryRegionFilter === "asia") {
      const asiaSlugs = new Set(["trung-quoc", "han-quoc", "nhat-ban", "thai-lan", "viet-nam", "hong-kong", "an-do", "dai-loan", "tai-wan", "philippines", "malaysia", "indonesia", "singapore", "tho-nhi-ky", "trieu-tien", "campuchia", "lao", "myanmar"]);
      return sortedCountries.filter((c) => asiaSlugs.has(c.slug) || ["CN", "KR", "JP", "VN", "TH", "HK", "IN", "TW"].includes(getCountryCode(c.slug) || ""));
    }
    if (countryRegionFilter === "west") {
      const westSlugs = new Set(["au-my", "phap", "anh", "duc", "tay-ban-nha", "canada", "uc", "y", "nga", "na-uy", "thuy-dien", "ha-lan", "ba-lan", "bi", "thuy-si", "dan-mach", "brazil", "mexico"]);
      return sortedCountries.filter((c) => westSlugs.has(c.slug) || !["trung-quoc", "han-quoc", "nhat-ban", "thai-lan", "viet-nam", "hong-kong", "an-do", "dai-loan"].includes(c.slug));
    }
    return sortedCountries;
  }, [sortedCountries, countrySearchQuery, filteredCountries, countryRegionFilter]);

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
    setCategoryThematicFilter("all");
    setCountryRegionFilter("all");
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
      {/* MOBILE BOTTOM NAVIGATION BAR (MATCHING NATIVE APP TAB BAR) */}
      {/* ======================================================== */}
      <nav
        aria-label="Điều hướng chính"
        className={cn(
          "lg:hidden fixed left-3 right-3 bottom-0 z-[140] pointer-events-auto select-none touch-manipulation",
          isPlayerFullscreen && "hidden pointer-events-none"
        )}
        style={{
          bottom: "max(0.6rem, env(safe-area-inset-bottom, 0px))",
        }}
      >
        <div className="w-full max-w-lg mx-auto h-[64px] rounded-[32px] bg-[#223128] border-[1.2px] border-white/20 border-t-white/30 shadow-[0_8px_24px_rgba(0,0,0,0.6)] backdrop-blur-2xl flex items-center justify-between px-1.5">
          {/* Tab 1: Trang Chủ */}
          {(() => {
            const active = currentActiveTab === "/";
            return (
              <Link
                href="/"
                prefetch={true}
                onClick={(e) => handleBottomNavNavigate("/", e)}
                className="flex-1 h-full flex items-center justify-center select-none touch-manipulation active:scale-95 transition-transform"
                aria-label="Trang Chủ"
              >
                {active ? (
                  <div className="w-[92%] h-[50px] rounded-[22px] bg-[#20D66B] flex flex-col items-center justify-center gap-0.5 shadow-[0_4px_12px_rgba(32,214,107,0.45)]">
                    <Home className="w-[18px] h-[18px] text-[#051309] stroke-[2.6]" />
                    <span className="text-[9.5px] font-black text-[#051309] tracking-tight leading-none">
                      Trang chủ
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-1 py-1">
                    <Home className="w-[19px] h-[19px] text-white/70 stroke-[2]" />
                    <span className="text-[9.5px] font-bold text-white/70 tracking-tight leading-none">
                      Trang chủ
                    </span>
                  </div>
                )}
              </Link>
            );
          })()}

          {/* Tab 2: Chiếu Rạp */}
          {(() => {
            const active = currentActiveTab === "cinema";
            return (
              <Link
                href="/?typeList=phim-chieu-rap"
                prefetch={true}
                onClick={(e) => handleBottomNavNavigate("/?typeList=phim-chieu-rap", e)}
                className="flex-1 h-full flex items-center justify-center select-none touch-manipulation active:scale-95 transition-transform"
                aria-label="Chiếu Rạp"
              >
                {active ? (
                  <div className="w-[92%] h-[50px] rounded-[22px] bg-[#20D66B] flex flex-col items-center justify-center gap-0.5 shadow-[0_4px_12px_rgba(32,214,107,0.45)]">
                    <Film className="w-[18px] h-[18px] text-[#051309] stroke-[2.6]" />
                    <span className="text-[9.5px] font-black text-[#051309] tracking-tight leading-none">
                      Chiếu rạp
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-1 py-1">
                    <Film className="w-[19px] h-[19px] text-white/70 stroke-[2]" />
                    <span className="text-[9.5px] font-bold text-white/70 tracking-tight leading-none">
                      Chiếu rạp
                    </span>
                  </div>
                )}
              </Link>
            );
          })()}

          {/* Tab 3: Yêu Thích */}
          {(() => {
            const active = currentActiveTab === "/favorites";
            return (
              <Link
                href="/favorites"
                prefetch={true}
                onClick={(e) => handleBottomNavNavigate("/favorites", e)}
                className="flex-1 h-full flex items-center justify-center select-none touch-manipulation active:scale-95 transition-transform"
                aria-label="Yêu Thích"
              >
                {active ? (
                  <div className="w-[92%] h-[50px] rounded-[22px] bg-[#20D66B] flex flex-col items-center justify-center gap-0.5 shadow-[0_4px_12px_rgba(32,214,107,0.45)]">
                    <Heart className="w-[18px] h-[18px] text-[#051309] fill-[#051309] stroke-[2.6]" />
                    <span className="text-[9.5px] font-black text-[#051309] tracking-tight leading-none">
                      Yêu thích
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-1 py-1">
                    <Heart className="w-[19px] h-[19px] text-white/70 stroke-[2]" />
                    <span className="text-[9.5px] font-bold text-white/70 tracking-tight leading-none">
                      Yêu thích
                    </span>
                  </div>
                )}
              </Link>
            );
          })()}

          {/* Tab 4: Lịch Sử */}
          {(() => {
            const active = currentActiveTab === "/recently";
            return (
              <Link
                href="/recently"
                prefetch={true}
                onClick={(e) => handleBottomNavNavigate("/recently", e)}
                className="flex-1 h-full flex items-center justify-center select-none touch-manipulation active:scale-95 transition-transform"
                aria-label="Lịch Sử Xem"
              >
                {active ? (
                  <div className="w-[92%] h-[50px] rounded-[22px] bg-[#20D66B] flex flex-col items-center justify-center gap-0.5 shadow-[0_4px_12px_rgba(32,214,107,0.45)]">
                    <Clock className="w-[18px] h-[18px] text-[#051309] stroke-[2.6]" />
                    <span className="text-[9.5px] font-black text-[#051309] tracking-tight leading-none">
                      Lịch sử
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-1 py-1">
                    <Clock className="w-[19px] h-[19px] text-white/70 stroke-[2]" />
                    <span className="text-[9.5px] font-bold text-white/70 tracking-tight leading-none">
                      Lịch sử
                    </span>
                  </div>
                )}
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
                className="flex-1 h-full flex items-center justify-center select-none touch-manipulation active:scale-95 transition-transform"
                aria-label="Tài Khoản"
              >
                {active ? (
                  <div className="w-[92%] h-[50px] rounded-[22px] bg-[#20D66B] flex flex-col items-center justify-center gap-0.5 shadow-[0_4px_12px_rgba(32,214,107,0.45)]">
                    {user?.avatar ? (
                      <div className="w-[19px] h-[19px] rounded-full overflow-hidden shrink-0 border border-[#051309] relative">
                        <Image src={user.avatar} alt="" fill unoptimized className="object-cover" sizes="19px" />
                      </div>
                    ) : (
                      <User className="w-[18px] h-[18px] text-[#051309] stroke-[2.6]" />
                    )}
                    <span className="text-[9.5px] font-black text-[#051309] tracking-tight leading-none">
                      Tài khoản
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-1 py-1">
                    {user?.avatar ? (
                      <div className="w-[20px] h-[20px] rounded-full overflow-hidden shrink-0 border border-white/20 relative">
                        <Image src={user.avatar} alt="" fill unoptimized className="object-cover" sizes="20px" />
                      </div>
                    ) : (
                      <User className="w-[19px] h-[19px] text-white/70 stroke-[2]" />
                    )}
                    <span className="text-[9.5px] font-bold text-white/70 tracking-tight leading-none">
                      Tài khoản
                    </span>
                  </div>
                )}
              </button>
            );
          })()}
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
        {/* Sidebar Header / Brand Name (Mobile Drawer Only) */}
        <div className="lg:hidden h-16 px-4 flex items-center justify-between border-b border-white/10 shrink-0">
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
            className="p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Navigation Body - Balanced spacing to fit frame seamlessly and prevent cutoff */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 lg:p-2 lg:pt-3 lg:pb-2 space-y-2.5 lg:space-y-0.5 custom-scrollbar">
          
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

          {/* Divider 3 */}
          <div className="h-[1px] bg-white/5 mx-2 lg:mx-1 my-2 lg:my-1.5" />

          {/* Download App Navigation Entry */}
          <div className="pt-1 pb-6 lg:pb-8">
            <Link
              href="/tai-app"
              prefetch={true}
              onClick={() => {
                setIsMobileOpen(false);
                navigateToTab("/tai-app");
              }}
              className={cn(
                "w-full relative flex items-center justify-between px-3 lg:px-2 py-2.5 lg:py-2 rounded-xl text-sm lg:text-[13px] font-medium lg:font-semibold transition-all duration-200 group overflow-hidden border text-left cursor-pointer",
                "border-brand-green/40 hover:border-brand-green/80 shadow-[0_0_12px_rgba(32,214,107,0.12)] hover:shadow-[0_0_16px_rgba(32,214,107,0.22)]",
                pathname === "/tai-app"
                  ? "bg-brand-green/15 text-white border-brand-green/70"
                  : "bg-white/[0.03] hover:bg-white/[0.07] text-white/80 hover:text-white"
              )}
              aria-current={pathname === "/tai-app" ? "page" : undefined}
            >
              {pathname === "/tai-app" && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 lg:h-3.5 bg-brand-green rounded-r-full shadow-[0_0_8px_rgba(32,214,107,0.8)]" />
              )}

              <div className="flex items-center gap-2.5 lg:gap-2 min-w-0">
                <div
                  className={cn(
                    "w-6 h-6 lg:w-5 lg:h-5 rounded-lg flex items-center justify-center transition-colors shrink-0",
                    pathname === "/tai-app"
                      ? "bg-brand-green/20 text-brand-green"
                      : "bg-brand-green/10 text-brand-green group-hover:bg-brand-green/20 border border-brand-green/20"
                  )}
                >
                  <Smartphone className="w-3.5 h-3.5 lg:w-3 lg:h-3" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="truncate leading-tight font-semibold text-white group-hover:text-brand-green transition-colors">
                    Tải App Mobile
                  </span>
                  <span className="text-[10px] lg:text-[9px] text-white/40 group-hover:text-white/60 leading-none truncate mt-0.5">
                    iOS & Android
                  </span>
                </div>
              </div>

              <span
                className={cn(
                  "text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border shrink-0 transition-colors ml-1",
                  pathname === "/tai-app"
                    ? "bg-brand-green/20 border-brand-green/50 text-brand-green"
                    : "bg-brand-green/10 border-brand-green/30 text-brand-green group-hover:bg-brand-green/20"
                )}
              >
                IPA/APK
              </span>
            </Link>
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
      {/* MODAL DANH MỤC RIÊNG BIỆT (THỂ LOẠI / QUỐC GIA / NĂM)    */}
      {/* ======================================================== */}
      {activeModal && (
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
              "relative z-10 w-full sm:max-w-3xl md:max-w-4xl lg:max-w-5xl xl:max-w-6xl max-h-[92dvh] sm:max-h-[88vh] lg:max-h-[86vh] bg-[#0C1310]/98 backdrop-blur-2xl border-t sm:border border-emerald-500/25 rounded-t-[28px] sm:rounded-[32px] p-4 sm:p-7 md:p-8 flex flex-col shadow-[0_25px_70px_rgba(0,0,0,0.95),0_0_40px_rgba(32,214,107,0.1)] overflow-hidden transform-gpu",
              isClosing ? "scale-95 opacity-0 duration-150" : "animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200"
            )}
          >
            {/* Top Ambient Glow Line */}
            <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#20D66B]/50 to-transparent pointer-events-none" />

            {/* Mobile Sheet Handle Bar */}
            <div className="sm:hidden w-12 h-1 bg-white/20 hover:bg-white/30 rounded-full mx-auto mb-2 shrink-0" />

            {/* Modal Header: 1 Danh Mục Duy Nhất (Không Switcher, Không Emoji) */}
            <div className="relative z-10 flex items-center justify-between pb-3.5 sm:pb-4 border-b border-white/[0.08] shrink-0 gap-3">
              <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
                <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-[#20D66B]/15 border border-[#20D66B]/30 flex items-center justify-center text-[#20D66B] shrink-0 shadow-[0_0_15px_rgba(32,214,107,0.2)]">
                  {activeModal === "categories" && <Layers className="w-4.5 h-4.5 sm:w-6 sm:h-6" />}
                  {activeModal === "countries" && <Globe className="w-4.5 h-4.5 sm:w-6 sm:h-6" />}
                  {activeModal === "years" && <Calendar className="w-4.5 h-4.5 sm:w-6 sm:h-6" />}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-lg sm:text-2xl font-black text-white tracking-tight truncate">
                      {activeModal === "categories" && "Thể Loại Phim"}
                      {activeModal === "countries" && "Quốc Gia Điện Ảnh"}
                      {activeModal === "years" && "Năm Phát Hành"}
                    </h3>
                    <span className="text-[11px] sm:text-xs font-mono font-bold text-[#20D66B] bg-[#20D66B]/10 border border-[#20D66B]/25 px-2.5 py-0.5 sm:py-1 rounded-full shrink-0">
                      {activeModal === "categories" && `${categories.length} THỂ LOẠI`}
                      {activeModal === "countries" && `${countries.length} QUỐC GIA`}
                      {activeModal === "years" && `NĂM ${currentYearNum}`}
                    </span>
                  </div>
                  <p className="hidden sm:block text-xs sm:text-sm text-white/45 mt-0.5">
                    {activeModal === "categories" && "Khám phá kho phim phong phú theo thể loại bạn yêu thích"}
                    {activeModal === "countries" && "Lọc phim theo xuất xứ và nền điện ảnh quốc gia"}
                    {activeModal === "years" && "Tìm kiếm các tác phẩm theo năm phát hành và thập niên"}
                  </p>
                </div>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={closeModal}
                className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white/5 hover:bg-white/10 active:scale-90 border border-white/10 flex items-center justify-center text-white/70 hover:text-white transition-all shrink-0 cursor-pointer"
                aria-label="Đóng bảng"
              >
                <X className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
              </button>
            </div>

            {/* ==================================================== */}
            {/* THỂ LOẠI (KHÔNG EMOJI, THIẾT KẾ ĐIỆN ẢNH SANG TRỌNG) */}
            {/* ==================================================== */}
            {activeModal === "categories" && (
              <>
                {/* Search & Sub-filters (KHÔNG EMOJI) */}
                <div className="relative z-10 pt-3 pb-2.5 shrink-0 space-y-2.5">
                  <div className="relative flex items-center">
                    <Search className="w-4.5 h-4.5 sm:w-5 sm:h-5 absolute left-3.5 sm:left-4 text-emerald-400/60 pointer-events-none" />
                    <input
                      type="text"
                      aria-label="Lọc thể loại phim"
                      value={categorySearchQuery}
                      onChange={(e) => setCategorySearchQuery(e.target.value)}
                      placeholder="Lọc nhanh thể loại (Hành động, Cổ trang, Tình cảm...)"
                      className="w-full h-10 sm:h-12 bg-white/[0.04] hover:bg-white/[0.06] focus:bg-white/[0.08] border border-white/10 focus:border-[#20D66B]/50 text-white placeholder-white/35 text-xs sm:text-[15px] rounded-xl sm:rounded-2xl pl-10 sm:pl-12 pr-10 outline-none transition-all duration-200 shadow-inner"
                      autoComplete="off"
                      spellCheck={false}
                    />
                    {categorySearchQuery && (
                      <button
                        type="button"
                        onClick={() => setCategorySearchQuery("")}
                        aria-label="Xóa tìm kiếm"
                        className="absolute right-3 p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Thematic Chips (KHÔNG EMOJI) */}
                  {!categorySearchQuery.trim() && (
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
                      {[
                        { id: "all", label: "Tất Cả" },
                        { id: "popular", label: "Phổ Biến" },
                        { id: "action", label: "Hành Động & Kịch Tính" },
                        { id: "romance", label: "Tình Cảm & Cổ Trang" },
                        { id: "anime", label: "Hoạt Hình & Khác" },
                      ].map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => setCategoryThematicFilter(f.id as any)}
                          className={cn(
                            "px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-lg text-xs sm:text-[13px] font-bold whitespace-nowrap transition-all select-none active:scale-95",
                            categoryThematicFilter === f.id
                              ? "bg-[#20D66B]/20 text-[#20D66B] border border-[#20D66B]/40 shadow-[0_0_12px_rgba(32,214,107,0.2)]"
                              : "bg-white/[0.03] hover:bg-white/[0.06] text-white/60 hover:text-white border border-white/[0.06]"
                          )}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Genre Cards Grid (KHÔNG EMOJI - Minimalist Cinema Style) */}
                <div
                  ref={categoriesScrollRef}
                  className="relative z-10 flex-1 overflow-y-auto pr-2 sm:pr-3 modal-scroll custom-scrollbar overscroll-contain -webkit-overflow-scrolling-touch"
                >
                  {displayedCategories.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-3.5 md:gap-4 pb-4">
                      {displayedCategories.map((cat, idx) => {
                        const active = currentCategory === cat.slug;
                        return (
                          <button
                            key={`${cat.slug}-${idx}`}
                            type="button"
                            onClick={(e) => handleSelectCategory(cat.slug, e)}
                            className={cn(
                              "group relative flex items-center justify-between p-2.5 sm:p-3.5 md:p-4 rounded-xl sm:rounded-2xl border text-left transition-all duration-200 active:scale-95 min-w-0 shadow-none",
                              active
                                ? "bg-[#20D66B]/15 text-[#20D66B] border-[#20D66B]/60 font-black shadow-[0_0_15px_rgba(32,214,107,0.2)]"
                                : "bg-white/[0.03] hover:bg-white/[0.07] border-white/[0.06] hover:border-[#20D66B]/35 text-white/85 hover:text-white"
                            )}
                          >
                            <div className="flex items-center gap-3 min-w-0 truncate">
                              <span
                                className={cn(
                                  "w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full shrink-0 transition-all",
                                  active
                                    ? "bg-[#20D66B] scale-125 shadow-[0_0_8px_rgba(32,214,107,0.8)]"
                                    : "bg-white/25 group-hover:bg-[#20D66B] group-hover:scale-125"
                                )}
                              />
                              <span className={cn("text-xs sm:text-[15px] md:text-base truncate", active ? "font-black" : "font-semibold")}>
                                {cat.name}
                              </span>
                            </div>
                            {active && (
                              <Check className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-[#20D66B] stroke-[3] shrink-0 ml-1.5" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-12 text-center text-white/40 text-xs sm:text-sm">
                      Không tìm thấy thể loại nào phù hợp với &quot;{categorySearchQuery}&quot;
                    </div>
                  )}
                </div>

                {/* Footer Bar */}
                <div className="relative z-10 pt-3 mt-1.5 border-t border-white/[0.08] flex items-center justify-between text-xs sm:text-sm text-white/50 shrink-0 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
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
                    className="text-[#20D66B] hover:underline font-semibold shrink-0 text-[11px] sm:text-xs"
                  >
                    Xem tất cả phim
                  </button>
                </div>
              </>
            )}

            {/* ==================================================== */}
            {/* QUỐC GIA (KHÔNG EMOJI)                               */}
            {/* ==================================================== */}
            {activeModal === "countries" && (
              <>
                {/* Search & Sub-filters (KHÔNG EMOJI) */}
                <div className="relative z-10 pt-3 pb-2.5 shrink-0 space-y-2.5">
                  <div className="relative flex items-center">
                    <Search className="w-4.5 h-4.5 sm:w-5 sm:h-5 absolute left-3.5 sm:left-4 text-emerald-400/60 pointer-events-none" />
                    <input
                      type="text"
                      aria-label="Lọc quốc gia phim"
                      value={countrySearchQuery}
                      onChange={(e) => setCountrySearchQuery(e.target.value)}
                      placeholder="Lọc nhanh quốc gia (Hàn Quốc, Trung Quốc, Âu Mỹ...)"
                      className="w-full h-10 sm:h-12 bg-white/[0.04] hover:bg-white/[0.06] focus:bg-white/[0.08] border border-white/10 focus:border-[#20D66B]/50 text-white placeholder-white/35 text-xs sm:text-[15px] rounded-xl sm:rounded-2xl pl-10 sm:pl-12 pr-10 outline-none transition-all duration-200 shadow-inner"
                      autoComplete="off"
                      spellCheck={false}
                    />
                    {countrySearchQuery && (
                      <button
                        type="button"
                        onClick={() => setCountrySearchQuery("")}
                        aria-label="Xóa tìm kiếm"
                        className="absolute right-3 p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Regional Chips (KHÔNG EMOJI) */}
                  {!countrySearchQuery.trim() && (
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
                      {[
                        { id: "all", label: "Tất Cả" },
                        { id: "popular", label: "Nổi Bật" },
                        { id: "asia", label: "Châu Á" },
                        { id: "west", label: "Âu Mỹ & Toàn Cầu" },
                      ].map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => setCountryRegionFilter(f.id as any)}
                          className={cn(
                            "px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-lg text-xs sm:text-[13px] font-bold whitespace-nowrap transition-all select-none active:scale-95",
                            countryRegionFilter === f.id
                              ? "bg-[#20D66B]/20 text-[#20D66B] border border-[#20D66B]/40 shadow-[0_0_12px_rgba(32,214,107,0.2)]"
                              : "bg-white/[0.03] hover:bg-white/[0.06] text-white/60 hover:text-white border border-white/[0.06]"
                          )}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Country Cards Grid */}
                <div
                  ref={countriesScrollRef}
                  className="relative z-10 flex-1 overflow-y-auto pr-2 sm:pr-3 modal-scroll custom-scrollbar overscroll-contain -webkit-overflow-scrolling-touch"
                >
                  {displayedCountries.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-3.5 md:gap-4 pb-4">
                      {displayedCountries.map((c) => {
                        const active = currentCountry === c.slug;
                        const code = c.code || getCountryCode(c.slug) || getCountryCode(c.name);
                        return (
                          <button
                            key={c.slug}
                            type="button"
                            onClick={(e) => handleSelectCountry(c.slug, e)}
                            className={cn(
                              "group relative flex items-center gap-3 p-2.5 sm:p-3.5 md:p-4 rounded-xl sm:rounded-2xl border text-left transition-all duration-200 active:scale-95 min-w-0 shadow-none",
                              active
                                ? "bg-[#20D66B]/15 text-[#20D66B] border-[#20D66B]/60 font-black shadow-[0_0_15px_rgba(32,214,107,0.2)]"
                                : "bg-white/[0.03] hover:bg-white/[0.07] border-white/[0.06] hover:border-[#20D66B]/35 text-white/85 hover:text-white"
                            )}
                          >
                            <div className="w-8 h-5.5 sm:w-11 sm:h-7.5 md:w-12 md:h-8 rounded sm:rounded-md overflow-hidden border border-white/15 shrink-0 bg-black/40 flex items-center justify-center shadow-sm">
                              {(!code || code === "WW") ? (
                                <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-[#20D66B]" />
                              ) : (
                                <img
                                  src={`https://flagcdn.com/w80/${code.toLowerCase()}.png`}
                                  alt={c.name}
                                  loading="lazy"
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
                                  onError={(e) => {
                                    e.currentTarget.style.display = "none";
                                  }}
                                />
                              )}
                            </div>
                            <span className={cn("text-xs sm:text-[15px] md:text-base font-semibold truncate flex-1", active && "font-black text-[#20D66B]")}>
                              {c.name}
                            </span>
                            {active && (
                              <Check className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-[#20D66B] stroke-[3] shrink-0 ml-auto" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-12 text-center text-white/40 text-xs sm:text-sm">
                      Không tìm thấy quốc gia nào phù hợp với &quot;{countrySearchQuery}&quot;
                    </div>
                  )}
                </div>

                {/* Footer Bar */}
                <div className="relative z-10 pt-3 mt-1.5 border-t border-white/[0.08] flex items-center justify-between text-xs sm:text-sm text-white/50 shrink-0 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
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
                    className="text-[#20D66B] hover:underline font-semibold shrink-0 text-[11px] sm:text-xs"
                  >
                    Xem tất cả phim
                  </button>
                </div>
              </>
            )}

            {/* ==================================================== */}
            {/* NĂM PHÁT HÀNH (KHÔNG EMOJI)                          */}
            {/* ==================================================== */}
            {activeModal === "years" && (
              <>
                {/* Search & Sub-filters (KHÔNG EMOJI) */}
                <div className="relative z-10 pt-3 pb-2.5 shrink-0 space-y-2.5">
                  <div className="relative flex items-center">
                    <Search className="w-4.5 h-4.5 sm:w-5 sm:h-5 absolute left-3.5 sm:left-4 text-emerald-400/60 pointer-events-none" />
                    <input
                      type="text"
                      aria-label="Nhập năm phát hành"
                      value={yearSearchQuery}
                      onChange={(e) => setYearSearchQuery(e.target.value)}
                      placeholder="Nhập năm phát hành (2026, 2025, 2024...)"
                      className="w-full h-10 sm:h-12 bg-white/[0.04] hover:bg-white/[0.06] focus:bg-white/[0.08] border border-white/10 focus:border-[#20D66B]/50 text-white placeholder-white/35 text-xs sm:text-[15px] rounded-xl sm:rounded-2xl pl-10 sm:pl-12 pr-10 outline-none transition-all duration-200 shadow-inner"
                      autoComplete="off"
                      spellCheck={false}
                    />
                    {yearSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setYearSearchQuery("")}
                        aria-label="Xóa tìm kiếm"
                        className="absolute right-3 p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Decade Chips (KHÔNG EMOJI) */}
                  {!yearSearchQuery.trim() && (
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
                      {[
                        { id: "all", label: "Tất Cả Năm" },
                        { id: "2020s", label: "2020s Mới" },
                        { id: "2010s", label: "2010s" },
                        { id: "2000s", label: "2000s" },
                        { id: "classic", label: "Kinh Điển" },
                      ].map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => setYearDecade(f.id as any)}
                          className={cn(
                            "px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-lg text-xs sm:text-[13px] font-bold whitespace-nowrap transition-all select-none active:scale-95",
                            yearDecade === f.id
                              ? "bg-[#20D66B]/20 text-[#20D66B] border border-[#20D66B]/40 shadow-[0_0_12px_rgba(32,214,107,0.2)]"
                              : "bg-white/[0.03] hover:bg-white/[0.06] text-white/60 hover:text-white border border-white/[0.06]"
                          )}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Years Grid */}
                <div
                  ref={yearsScrollRef}
                  className="relative z-10 flex-1 overflow-y-auto pr-2 sm:pr-3 modal-scroll custom-scrollbar overscroll-contain -webkit-overflow-scrolling-touch"
                >
                  {displayedYears.length > 0 ? (
                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2.5 sm:gap-3 md:gap-3.5 pb-4">
                      {displayedYears.map((y) => {
                        const active = currentYear === String(y);
                        const isLatest = y >= currentYearNum - 1;
                        return (
                          <button
                            key={y}
                            type="button"
                            onClick={(e) => handleSelectYear(y, e)}
                            className={cn(
                              "group relative py-2.5 sm:py-3.5 md:py-4 px-2 rounded-xl sm:rounded-2xl border text-center transition-all duration-200 active:scale-95 min-w-0 flex flex-col items-center justify-center gap-0.5",
                              active
                                ? "bg-gradient-to-r from-[#20D66B] to-[#10B981] text-[#050807] border-[#20D66B] font-black shadow-[0_0_15px_rgba(32,214,107,0.35)] scale-105 z-10"
                                : isLatest
                                ? "bg-emerald-500/[0.08] hover:bg-emerald-500/[0.18] border-emerald-500/30 hover:border-[#20D66B] text-white font-bold"
                                : "bg-white/[0.03] hover:bg-white/[0.08] border-white/[0.06] hover:border-[#20D66B]/40 text-white/80 hover:text-white font-semibold"
                            )}
                          >
                            {isLatest && !active && (
                              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#20D66B] shadow-[0_0_6px_rgba(32,214,107,0.8)] animate-pulse" />
                            )}
                            <span className="text-sm sm:text-base md:text-lg tracking-tight font-bold">
                              {y}
                            </span>
                            {active ? (
                              <span className="text-[10px] sm:text-xs font-black text-[#050807] flex items-center gap-0.5">
                                <Check className="w-3 h-3 stroke-[3]" /> Chọn
                              </span>
                            ) : isLatest ? (
                              <span className="text-[10px] sm:text-xs text-[#20D66B] font-mono font-medium">
                                Mới
                              </span>
                            ) : null}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-12 text-center text-white/40 text-xs sm:text-sm">
                      Không tìm thấy năm nào phù hợp với &quot;{yearSearchQuery}&quot;
                    </div>
                  )}
                </div>

                {/* Footer Bar */}
                <div className="relative z-10 pt-3 mt-1.5 border-t border-white/[0.08] flex items-center justify-between text-xs sm:text-sm text-white/50 shrink-0 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
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
                    className="text-[#20D66B] hover:underline font-semibold shrink-0 text-[11px] sm:text-xs"
                  >
                    Xem tất cả phim
                  </button>
                </div>
              </>
            )}
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
