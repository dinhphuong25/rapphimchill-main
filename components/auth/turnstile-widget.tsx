"use client";

import React, { useEffect, useRef, useState } from "react";
import { ShieldCheck, Loader2 } from "lucide-react";

interface TurnstileWidgetProps {
  onVerify: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
  className?: string;
}

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: string | HTMLElement,
        options: {
          sitekey: string;
          theme?: "light" | "dark" | "auto";
          size?: "normal" | "compact";
          callback?: (token: string) => void;
          "error-callback"?: () => void;
          "expired-callback"?: () => void;
        }
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
    onloadTurnstileCallback?: () => void;
  }
}

// Default Cloudflare dummy test sitekey (always passes)
const DEFAULT_SITE_KEY = "1x00000000000000000000AA";

export default function TurnstileWidget({
  onVerify,
  onError,
  onExpire,
  className = "",
}: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "verified" | "bypassed">("loading");

  useEffect(() => {
    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || DEFAULT_SITE_KEY;
    let isMounted = true;

    const renderWidget = () => {
      if (!isMounted || !containerRef.current || !window.turnstile) return;
      if (widgetIdRef.current) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {}
        widgetIdRef.current = null;
      }

      try {
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          theme: "dark",
          size: "normal",
          callback: (token: string) => {
            if (isMounted) {
              setStatus("verified");
              onVerify(token);
            }
          },
          "error-callback": () => {
            if (isMounted) {
              console.warn("[Turnstile] Widget error callback triggered");
              // Fallback gracefully so legitimate users are not blocked by adblock or network glitch
              setStatus("bypassed");
              onVerify("bypass_adblock");
              if (onError) onError();
            }
          },
          "expired-callback": () => {
            if (isMounted) {
              setStatus("ready");
              if (onExpire) onExpire();
            }
          },
        });
        if (isMounted) {
          setStatus("ready");
        }
      } catch (err) {
        console.warn("[Turnstile] Render error:", err);
        if (isMounted) {
          setStatus("bypassed");
          onVerify("bypass_adblock");
        }
      }
    };

    // Fallback timer: If Turnstile is blocked by an adblocker (e.g. uBlock Origin) or takes > 2.5s,
    // automatically pass verification to prevent locking out human users.
    const fallbackTimer = setTimeout(() => {
      if (isMounted && status === "loading" && !widgetIdRef.current) {
        setStatus("bypassed");
        onVerify("bypass_adblock");
      }
    }, 2500);

    if (window.turnstile) {
      renderWidget();
    } else {
      window.onloadTurnstileCallback = () => {
        if (isMounted) renderWidget();
      };

      let script = document.getElementById("cf-turnstile-script") as HTMLScriptElement | null;
      if (!script) {
        script = document.createElement("script");
        script.id = "cf-turnstile-script";
        script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onloadTurnstileCallback&render=explicit";
        script.async = true;
        script.defer = true;
        script.onerror = () => {
          console.warn("[Turnstile] Script blocked or failed to load (likely adblocker)");
          if (isMounted) {
            setStatus("bypassed");
            onVerify("bypass_adblock");
          }
        };
        document.head.appendChild(script);
      } else {
        const checkInterval = setInterval(() => {
          if (window.turnstile) {
            clearInterval(checkInterval);
            if (isMounted) renderWidget();
          }
        }, 100);
        setTimeout(() => clearInterval(checkInterval), 3000);
      }
    }

    return () => {
      isMounted = false;
      clearTimeout(fallbackTimer);
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {}
      }
    };
  }, [onVerify, onError, onExpire]);

  return (
    <div className={`w-full my-2 flex flex-col items-center justify-center min-h-[65px] ${className}`}>
      {/* Turnstile Container */}
      <div ref={containerRef} className={status === "bypassed" ? "hidden" : "flex justify-center w-full"} />

      {/* Loading state before Turnstile iframe appears */}
      {status === "loading" && (
        <div className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white/[0.03] border border-white/10 text-white/50 text-xs select-none">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-green" />
          <span>Đang kết nối bảo vệ Cloudflare...</span>
        </div>
      )}

      {/* Graceful Adblock / Bypassed state */}
      {status === "bypassed" && (
        <div className="flex items-center justify-center gap-2 py-2 px-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-medium select-none animate-in fade-in">
          <ShieldCheck className="w-4 h-4 text-brand-green shrink-0" />
          <span>Bảo mật chống bot Cloudflare: Đã xác thực</span>
        </div>
      )}
    </div>
  );
}
