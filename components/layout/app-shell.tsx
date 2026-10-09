"use client";

import { memo } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/sidebar";
import Header from "@/components/header";

import { useNavigationTab } from "@/context/navigation-tab-context";
import RecentlyWatchedClient from "@/app/recently/recently-client";
import FavoritesClient from "@/app/favorites/favorites-client";

interface AppShellProps {
  children: React.ReactNode;
}

function AppShellComponent({ children }: AppShellProps) {
  const pathname = usePathname();
  const { activeTab } = useNavigationTab();

  // Standalone pages that do not display the global sidebar/header
  const isStandalonePage =
    pathname.startsWith("/watch") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/maintenance");

  if (isStandalonePage) {
    return <>{children}</>;
  }

  // Instant Tab views when user navigates between /, /recently, /favorites
  const showInstantRecently = activeTab === "/recently" && pathname !== "/recently";
  const showInstantFavorites = activeTab === "/favorites" && pathname !== "/favorites";

  return (
    <div className="min-h-screen bg-cinema-bg text-cinema-text">
      {/* Persistent Left Sidebar & Mobile Bottom Dock - Kept in DOM across transitions */}
      <Sidebar />

      {/* Persistent Top Header */}
      <Header />

      {/* Dynamic Right-side Content Container */}
      <div className="min-h-screen lg:pl-[225px] transition-all duration-300 flex flex-col pb-24 lg:pb-0">
        <div className={showInstantRecently || showInstantFavorites ? "hidden" : "contents"}>
          {children}
        </div>
        {showInstantRecently && <RecentlyWatchedClient />}
        {showInstantFavorites && <FavoritesClient />}
      </div>
    </div>
  );
}

export default memo(AppShellComponent);
