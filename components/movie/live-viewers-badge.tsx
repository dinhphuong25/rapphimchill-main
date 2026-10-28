"use client";

import React, { useEffect, useState, useRef } from "react";
import { Eye, Flame } from "lucide-react";
import { cn } from "@/lib/utils";

interface LiveViewersBadgeProps {
  slug: string;
  variant?: "default" | "compact" | "pill" | "subtle";
  className?: string;
  showIcon?: boolean;
}

export default function LiveViewersBadge({
  slug,
  variant = "default",
  className = "",
  showIcon = true,
}: LiveViewersBadgeProps) {
  const [viewers, setViewers] = useState<number | null>(null);
  const clientIdRef = useRef<string>("");

  useEffect(() => {
    // Generate or retrieve persistent anonymous clientId for this session
    if (typeof window !== "undefined") {
      let cid = sessionStorage.getItem("hiphim_viewer_cid");
      if (!cid) {
        cid = `cid_${Math.random().toString(36).substring(2, 10)}_${Date.now()}`;
        sessionStorage.setItem("hiphim_viewer_cid", cid);
      }
      clientIdRef.current = cid;
    }
  }, []);

  useEffect(() => {
    if (!slug) return;

    let isMounted = true;

    // Send heartbeat to count active viewer
    const sendHeartbeat = async () => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") {
        return; // Pause heartbeat when tab is hidden to save mobile battery and bandwidth
      }

      try {
        const res = await fetch("/api/live/viewers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug, clientId: clientIdRef.current }),
        });
        if (res.ok) {
          const data = await res.json();
          if (isMounted && typeof data.count === "number") {
            setViewers(data.count);
          }
        }
      } catch {
        // Silently ignore network hiccup
      }
    };

    // Initial fetch / heartbeat
    sendHeartbeat();

    // Pulse heartbeat every 25 seconds
    const interval = setInterval(sendHeartbeat, 25_000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        sendHeartbeat();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      isMounted = false;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [slug]);

  if (viewers === null) {
    return null;
  }

  if (variant === "compact") {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-brand-green text-[10px] sm:text-xs font-semibold select-none",
          className
        )}
        title={`${viewers} người đang xem phim này`}
      >
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-green opacity-75"></span>
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-brand-green"></span>
        </span>
        <span>{viewers}</span>
      </div>
    );
  }

  if (variant === "pill") {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-2 px-2.5 py-1 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-white/90 text-xs font-medium select-none shadow-sm",
          className
        )}
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-green opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-green"></span>
        </span>
        <span className="text-white font-bold tracking-tight">{viewers}</span>
        <span className="text-white/60 text-[11px]">đang xem</span>
      </div>
    );
  }

  // Default variant
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 backdrop-blur-sm border border-emerald-500/25 text-brand-green text-xs font-medium select-none shadow-[0_0_12px_rgba(32,214,107,0.15)]",
        className
      )}
      title="Số người đang xem trực tiếp cùng bạn"
    >
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-green opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-green"></span>
      </span>
      {showIcon && <Flame className="w-3.5 h-3.5 text-orange-400 fill-orange-400/20 shrink-0" />}
      <span className="font-bold text-white font-mono">{viewers}</span>
      <span className="text-white/70 text-[11px] hidden xs:inline">người đang xem</span>
    </div>
  );
}
