"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUserAuth, UserProfile } from "@/context/user-auth-context";

export interface WelcomeEventDetail {
  type: "new_register" | "welcome_back";
  user?: Partial<UserProfile> | null;
}

export default function WelcomePopup() {
  const { user, loading } = useUserAuth();
  const [data, setData] = useState<WelcomeEventDetail | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const closePopup = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => setData(null), 300);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const triggerWelcome = useCallback(
    (targetUser: Partial<UserProfile> | null = user, type: "new_register" | "welcome_back" = "welcome_back") => {
      setData({
        type,
        user: targetUser || null,
      });
      setIsVisible(true);

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        closePopup();
      }, 5000);
    },
    [user, closePopup]
  );

  // 1. Listen for explicit welcome events (e.g. after login, OTP register)
  useEffect(() => {
    const handleWelcomeEvent = (e: any) => {
      const detail: WelcomeEventDetail = e.detail;
      if (!detail) return;

      sessionStorage.setItem("hiphim_welcomed_this_session", "true");
      setData(detail);
      setIsVisible(true);

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        closePopup();
      }, 5000);
    };

    window.addEventListener("show-auth-welcome", handleWelcomeEvent);
    return () => {
      window.removeEventListener("show-auth-welcome", handleWelcomeEvent);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [closePopup]);

  // 2. Auto-detect whenever user visits/returns to the web in a new session or tab reopen
  useEffect(() => {
    if (loading) return; // Wait until initial auth resolves

    const welcomedThisSession = sessionStorage.getItem("hiphim_welcomed_this_session");
    if (!welcomedThisSession) {
      sessionStorage.setItem("hiphim_welcomed_this_session", "true");
      // Smooth 1.2s delay for seamless entrance after hero renders
      const timer = setTimeout(() => {
        triggerWelcome(user, "welcome_back");
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [loading, user, triggerWelcome]);

  // 3. Auto-detect when user returns to the web tab after being away (> 15 minutes)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        const lastActive = Number(localStorage.getItem("hiphim_last_active_time")) || 0;
        const now = Date.now();
        if (lastActive > 0 && now - lastActive > 15 * 60 * 1000) {
          triggerWelcome(user, "welcome_back");
        }
        localStorage.setItem("hiphim_last_active_time", now.toString());
      } else {
        localStorage.setItem("hiphim_last_active_time", Date.now().toString());
      }
    };

    const heartbeat = setInterval(() => {
      if (document.visibilityState === "visible") {
        localStorage.setItem("hiphim_last_active_time", Date.now().toString());
      }
    }, 60000);

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      clearInterval(heartbeat);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [user, triggerWelcome]);

  if (!data || !isVisible) return null;

  const currentUser = data.user;
  const userName = currentUser?.name || currentUser?.email?.split("@")[0] || "";

  return (
    <aside
      aria-label="Thông báo chào mừng"
      className={cn(
        "fixed z-[9999] transition-all duration-300 pointer-events-auto select-none",
        // Mobile: stays above bottom navigation dock; Desktop: bottom-right corner
        "bottom-20 right-4 sm:bottom-6 sm:right-6",
        "w-auto max-w-[calc(100vw-32px)] sm:max-w-[340px]",
        "animate-in slide-in-from-bottom-5 fade-in duration-300"
      )}
    >
      <div className="relative overflow-hidden rounded-2xl bg-[#0d1410]/95 backdrop-blur-xl border border-emerald-500/35 shadow-[0_16px_40px_rgba(0,0,0,0.85),0_0_20px_rgba(32,214,107,0.15)] py-2.5 px-3.5 sm:px-4 text-white flex items-center justify-between gap-3">
        {/* Glow ambient background accent */}
        <div className="absolute -top-6 -right-6 w-24 h-24 bg-brand-green/15 rounded-full blur-xl pointer-events-none" />

        {/* Simple Notification Text */}
        <span className="text-xs sm:text-sm font-semibold text-white tracking-tight relative z-10 truncate">
          {currentUser && userName
            ? `Chào mừng bạn quay trở lại, ${userName}!`
            : "Chào mừng bạn quay trở lại!"}
        </span>

        {/* Close Button */}
        <button
          type="button"
          onClick={closePopup}
          className="p-1 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0 relative z-10"
          aria-label="Đóng thông báo"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        {/* Bottom animated countdown progress bar */}
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/5 overflow-hidden">
          <div
            className="h-full bg-brand-green origin-left"
            style={{
              animation: "welcome-progress 5s linear forwards",
            }}
          />
        </div>
      </div>

      <style jsx>{`
        @keyframes welcome-progress {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </aside>
  );
}
