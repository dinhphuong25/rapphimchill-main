"use client";

import { memo } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/sidebar";
import Header from "@/components/header";

interface AppShellProps {
  children: React.ReactNode;
}

function AppShellComponent({ children }: AppShellProps) {
  const pathname = usePathname();

  // Standalone pages that do not display the global sidebar/header
  const isStandalonePage =
    pathname.startsWith("/watch") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/maintenance");

  if (isStandalonePage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-cinema-bg text-cinema-text relative">
      {/* Persistent Left Sidebar & Mobile Bottom Dock - Kept in DOM across transitions */}
      <Sidebar />

      {/* Persistent Top Header */}
      <Header />

      {/* Dynamic Right-side Content Container */}
      <div className="min-h-screen lg:pl-[225px] transition-all duration-300 flex flex-col">
        {children}
      </div>
    </div>
  );
}

export default memo(AppShellComponent);
