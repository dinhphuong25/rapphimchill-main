"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export function SplashScreen() {
  const [show, setShow] = useState(false);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    const isStandalone =
      typeof window !== "undefined" &&
      (window.matchMedia("(display-mode: standalone)").matches ||
        Boolean((navigator as any).standalone));

    if (isStandalone && !sessionStorage.getItem("pwa_splash_shown")) {
      sessionStorage.setItem("pwa_splash_shown", "1");
      setShow(true);
      const timer = setTimeout(() => {
        setIsFading(true);
        setTimeout(() => setShow(false), 300);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, []);

  if (!show) return null;

  return (
    <div className={`fixed inset-0 z-[9999] flex items-center justify-center bg-[#09090b] transition-opacity duration-300 pointer-events-none ${isFading ? 'opacity-0' : 'opacity-100'}`}>
      <div className="flex flex-col items-center justify-center text-center">
        <div className="relative flex items-center justify-center w-24 h-24 mb-6">
          {/* Hiệu ứng tỏa sáng xung quanh */}
          <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" style={{ animationDuration: "2s" }}></div>
          
          {/* Vòng xoay ngoại */}
          <div className="absolute inset-2 rounded-full border-2 border-white/10 border-t-primary animate-spin" style={{ animationDuration: "1.5s" }}></div>
          
          {/* Vòng xoay nội */}
          <div className="absolute inset-4 rounded-full border-2 border-white/5 border-b-primary animate-spin" style={{ animationDuration: "2s", animationDirection: "reverse" }}></div>
          
          {/* Icon Hi Phim ở giữa */}
          <Image
            src="/favicon.svg"
            alt="Hi Phim Logo"
            width={36}
            height={36}
            className="w-9 h-9 object-contain"
            priority
          />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-white tracking-wide">
            Đang kết nối Hi Phim...
          </h2>
          <p className="text-sm text-white/40">
            Trải nghiệm điện ảnh đỉnh cao
          </p>
        </div>
      </div>
    </div>
  );
}
