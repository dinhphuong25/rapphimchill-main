"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export function SplashScreen() {
  const [show, setShow] = useState(true);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    // Ẩn splash screen ngay lập tức sau khi hydrate xong 
    // thay vì bắt người dùng đợi 2-3 giây vô nghĩa
    setIsFading(true);
    const timer = setTimeout(() => setShow(false), 300); // Wait for fade out animation

    return () => clearTimeout(timer);
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
          
          {/* Icon Rạp chiếu phim ở giữa */}
          <Image
            src="/favicon.svg"
            alt="Rạp Phim Chill Logo"
            width={32}
            height={32}
            className="w-8 h-8 object-contain"
            priority
          />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-white tracking-wide">
            Đang chuẩn bị rạp phim...
          </h2>
          <p className="text-sm text-white/40">
            Trải nghiệm điện ảnh sắp bắt đầu
          </p>
        </div>
      </div>
    </div>
  );
}
