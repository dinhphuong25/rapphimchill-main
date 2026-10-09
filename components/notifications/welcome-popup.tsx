"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Sparkles, X, Crown, CheckCircle2, Film, LogIn } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUserAuth, UserProfile } from "@/context/user-auth-context";

export interface WelcomeEventDetail {
  type: "new_register" | "welcome_back";
  user?: Partial<UserProfile> | null;
}

export default function WelcomePopup() {
  const { user, loading, openAuthModal } = useUserAuth();
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
      }, 7000);
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
      }, 7000);
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
        // If user was away for more than 15 minutes and returns to the tab
        if (lastActive > 0 && now - lastActive > 15 * 60 * 1000) {
          triggerWelcome(user, "welcome_back");
        }
        localStorage.setItem("hiphim_last_active_time", now.toString());
      } else {
        localStorage.setItem("hiphim_last_active_time", Date.now().toString());
      }
    };

    // Heartbeat to keep last_active updated
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

  const isNewRegister = data.type === "new_register";
  const currentUser = data.user;
  const userName = currentUser?.name || currentUser?.email?.split("@")[0] || "";
  const isSuperAdmin =
    currentUser?.role === "admin" ||
    currentUser?.role === "superadmin" ||
    currentUser?.email?.toLowerCase() === "kimdinhphuong205@gmail.com";
  const initial = userName ? userName.charAt(0).toUpperCase() : "";

  return (
    <aside
      aria-label="Thông báo chào mừng"
      className={cn(
        "fixed z-[9999] transition-all duration-300 pointer-events-auto select-none",
        // Mobile: stays above bottom navigation dock; Desktop: bottom-right corner
        "bottom-20 right-4 sm:bottom-6 sm:right-6",
        "w-[calc(100vw-32px)] sm:w-[380px] max-w-[400px]",
        "animate-in slide-in-from-bottom-5 fade-in duration-300"
      )}
    >
      <div className="relative overflow-hidden rounded-2xl bg-[#0d1410] border border-emerald-500/35 shadow-[0_20px_50px_rgba(0,0,0,0.9),0_0_25px_rgba(32,214,107,0.18)] p-4 text-white">
        {/* Top glowing ambient gradient */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-brand-green/15 rounded-full blur-2xl pointer-events-none" />

        {/* Content Header */}
        <div className="flex items-start justify-between gap-3 relative z-10">
          <div className="flex items-center gap-3 min-w-0">
            {/* User Avatar Badge */}
            <div
              className={cn(
                "w-11 h-11 rounded-2xl font-black text-sm flex items-center justify-center shrink-0 shadow-lg relative",
                isSuperAdmin
                  ? "bg-gradient-to-tr from-amber-400 via-emerald-400 to-brand-green text-black ring-2 ring-amber-400/50"
                  : "bg-gradient-to-tr from-brand-green to-emerald-300 text-black ring-2 ring-brand-green/30"
              )}
            >
              {currentUser && initial ? (
                initial
              ) : (
                <Film className="w-5 h-5 text-black" />
              )}

              {isSuperAdmin ? (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-400 flex items-center justify-center text-[9px] text-black ring-1.5 ring-[#0d1410]">
                  <Crown className="w-2.5 h-2.5 fill-current" />
                </span>
              ) : isNewRegister ? (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-brand-green flex items-center justify-center text-[9px] text-black ring-1.5 ring-[#0d1410]">
                  <Sparkles className="w-2.5 h-2.5 fill-current" />
                </span>
              ) : null}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-bold px-2 py-0.2 rounded-full uppercase tracking-wider bg-brand-green/15 text-brand-green border border-brand-green/30">
                  {currentUser
                    ? isNewRegister
                      ? "Thành viên mới"
                      : "Chào mừng trở lại"
                    : "Lời chào từ Hi Phim"}
                </span>
                {isSuperAdmin && (
                  <span className="text-[9.5px] px-1.5 py-0.2 rounded-full font-mono font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                    ADMIN
                  </span>
                )}
              </div>
              <h4 className="text-sm font-bold text-white truncate mt-0.5">
                {currentUser
                  ? isNewRegister
                    ? "Chào mừng bạn gia nhập! 🎉"
                    : `Chào mừng trở lại, ${userName}! 👋`
                  : "Chào mừng bạn quay trở lại! 🍿"}
              </h4>
            </div>
          </div>

          {/* Close button */}
          <button
            type="button"
            onClick={closePopup}
            className="p-1 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
            aria-label="Đóng thông báo"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Message Description */}
        <p className="text-xs text-white/70 leading-relaxed mt-2.5 relative z-10">
          {currentUser ? (
            isNewRegister ? (
              <>
                Tài khoản của bạn đã được kích hoạt thành công. Thưởng thức hơn 50.000+ tựa phim bom tấn miễn phí ngay nào!
              </>
            ) : (
              <>
                Rất vui được gặp lại bạn. Chúc bạn có những phút giây thư giãn tuyệt vời cùng các tập phim yêu thích!
              </>
            )
          ) : (
            <>
              Khám phá kho 50.000+ tựa phim bom tấn chất lượng cao và các tập mới được cập nhật liên tục hoàn toàn miễn phí tại Hi Phim.
            </>
          )}
        </p>

        {/* Action button */}
        <div className="flex items-center justify-between gap-2 pt-3 mt-2 border-t border-white/5 relative z-10">
          {currentUser ? (
            <span className="text-[10.5px] text-brand-green font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Đã đồng bộ tài khoản
            </span>
          ) : (
            <button
              type="button"
              onClick={() => {
                closePopup();
                openAuthModal("login");
              }}
              className="text-[11px] text-brand-green font-bold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <LogIn className="w-3 h-3" />
              <span>Đăng nhập ngay</span>
            </button>
          )}

          <button
            type="button"
            onClick={closePopup}
            className="px-3 py-1.5 rounded-xl bg-brand-green hover:bg-brand-green-hover text-black font-extrabold text-xs flex items-center gap-1 cursor-pointer shadow-[0_0_12px_rgba(32,214,107,0.3)] active:scale-95 transition-all ml-auto"
          >
            <Film className="w-3 h-3" />
            <span>Xem phim ngay</span>
          </button>
        </div>

        {/* Bottom animated countdown progress bar */}
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/5 overflow-hidden">
          <div
            className="h-full bg-brand-green origin-left"
            style={{
              animation: "welcome-progress 7s linear forwards",
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
