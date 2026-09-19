"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";

interface NavigationTabContextType {
  activeTab: string | null;
  navigateToTab: (tab: string) => void;
}

const NavigationTabContext = createContext<NavigationTabContextType | undefined>(undefined);

function getTabFromPath(path: string): string | null {
  if (!path || path === "/") return "/";
  if (path === "/recently") return "/recently";
  if (path === "/favorites") return "/favorites";
  return null;
}

export function NavigationTabProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<string | null>(() => getTabFromPath(pathname));
  const hasEverMountedHomeRef = useRef(pathname === "/");

  if (pathname === "/") {
    hasEverMountedHomeRef.current = true;
  }

  // Sync with Next.js pathname changes (e.g. user navigates to /phim/[slug] or /watch)
  useEffect(() => {
    const matched = getTabFromPath(pathname);
    setActiveTab(matched);
    if (pathname === "/") {
      hasEverMountedHomeRef.current = true;
    }
  }, [pathname]);

  // Handle browser popstate (Back/Forward buttons)
  useEffect(() => {
    const handlePopState = () => {
      const currentPath = window.location.pathname;
      const tab = getTabFromPath(currentPath);
      setActiveTab(tab);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigateToTab = useCallback(
    (targetTab: string) => {
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "instant" });
      }

      // If user taps the active tab again
      if (activeTab === targetTab) {
        if (targetTab === "/" && typeof window !== "undefined" && window.location.search) {
          router.push("/");
        }
        return;
      }

      // 1. Synchronously set active tab (0ms instant UI update)
      setActiveTab(targetTab);

      // 2. Synchronously update browser address bar
      if (typeof window !== "undefined") {
        window.history.pushState(null, "", targetTab);
      }

      // 3. Fallback to router.push if home was never mounted in this session
      if (targetTab === "/" && !hasEverMountedHomeRef.current) {
        router.push("/");
      }
    },
    [activeTab, router]
  );

  const value = useMemo(() => ({ activeTab, navigateToTab }), [activeTab, navigateToTab]);

  return (
    <NavigationTabContext.Provider value={value}>
      {children}
    </NavigationTabContext.Provider>
  );
}

export function useNavigationTab() {
  const ctx = useContext(NavigationTabContext);
  if (!ctx) {
    throw new Error("useNavigationTab must be used within a NavigationTabProvider");
  }
  return ctx;
}
