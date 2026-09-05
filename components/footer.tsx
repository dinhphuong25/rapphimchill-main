"use client";

import Image from "next/image";
import Script from "next/script";
import { Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="w-full mt-auto py-8 sm:py-10 border-t border-white/5 bg-[#060a08]/90 backdrop-blur-xl select-none">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 flex flex-col items-center text-center space-y-4">
        
        {/* Brand Logo & Slogan */}
        <div className="flex items-center gap-2.5">
          <Image
            src="/favicon.svg"
            alt="Hi Phim Logo"
            width={28}
            height={28}
            className="w-7 h-7 object-contain"
          />
          <span className="text-base font-black text-white tracking-wide">
            HI <span className="text-brand-green">PHIM</span>
          </span>
          <span className="text-white/20 hidden sm:inline">•</span>
          <span className="text-xs font-semibold text-white/50 tracking-wider hidden sm:inline">
            Xem Phim HD Chuẩn Điện Ảnh Miễn Phí
          </span>
        </div>


        {/* Disclaimer Note */}
        <p className="text-[11px] text-white/40 max-w-2xl leading-relaxed">
          Tuyên bố miễn trừ trách nhiệm: Trang web chỉ tổng hợp và nhúng video từ các nguồn mở công cộng trên Internet. Chúng tôi không lưu trữ hoặc tải lên bất kỳ tập tin video nào trên máy chủ của mình.
        </p>

        {/* Developer Credit */}
        <p className="text-xs text-white/70">
          Được quản lý và phát triển bởi{" "}
          <a
            href="https://www.facebook.com/dinhphuong205/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-green font-bold hover:underline hover:text-brand-green-hover transition-colors"
          >
            Kim Đình Phương
          </a>
        </p>

        {/* Copyright Line */}
        <p className="text-[11px] font-medium text-white/45">
          © 2025 - 2026 HI PHIM. All rights reserved.
        </p>

        {/* DMCA Badge Directly Below Copyright Line */}
        <div className="pt-0.5 flex items-center justify-center">
          <a
            href="https://www.dmca.com/Protection/Status.aspx?ID=5a1e0cc9-8158-46c6-97a7-ba374504dcb5"
            title="DMCA.com Protection Status"
            className="dmca-badge inline-block transition-transform hover:scale-105 active:scale-95 duration-200 group"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img
              src="https://images.dmca.com/Badges/dmca-badge-w150-2x1-01.png?ID=5a1e0cc9-8158-46c6-97a7-ba374504dcb5"
              alt="DMCA.com Protection Status"
              className="h-6 sm:h-7 w-auto object-contain rounded opacity-85 group-hover:opacity-100 shadow-sm hover:shadow-[0_0_15px_rgba(34,197,94,0.35)] transition-all"
              loading="lazy"
            />
          </a>
        </div>

      </div>

      <Script src="https://images.dmca.com/Badges/DMCABadgeHelper.min.js" strategy="lazyOnload" />
    </footer>
  );
}

