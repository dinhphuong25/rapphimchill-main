"use client";

import Image from "next/image";
import { Heart } from "lucide-react";

interface FooterProps {
  customFooterText?: string;
}

export default function Footer({}: FooterProps = {}) {
  return (
    <footer className="w-full mt-auto py-3.5 sm:py-4 border-t border-white/[0.06] bg-[#050807]/90 backdrop-blur-xl select-none">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 flex flex-col md:flex-row items-center justify-between gap-2.5 md:gap-6">
        
        {/* Bên Trái: Ở trên là Logo & Tên thương hiệu, Ở dưới là dòng phi lợi nhuận */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left gap-1">
          <div className="flex items-center gap-2">
            <Image
              src="/favicon.svg"
              alt="Hi Phim Logo"
              width={20}
              height={20}
              className="w-5 h-5 object-contain"
            />
            <span className="text-sm font-black text-white tracking-wide">
              Hi <span className="text-brand-green">PHIM</span>
            </span>
          </div>

          <p className="text-[11px] text-white/40">
            Nền tảng xem phim miễn phí phi lợi nhuận.
          </p>
        </div>

        {/* Bên Phải: Ở trên là Copyright, Ở dưới là Người quản lý & phát triển */}
        <div className="flex flex-col items-center md:items-end text-center md:text-right gap-1 shrink-0">
          {/* Ở trên: Copyright */}
          <p className="text-[11px] font-medium text-white/45">
            © 2025 - 2026 <span className="text-white/70 font-semibold">Hi PHIM</span>. All rights reserved.
          </p>

          {/* Ở dưới: Người quản lý & phát triển */}
          <p className="text-[11px] text-white/60">
            Được quản lý và phát triển bởi{" "}
            <a
              href="https://www.facebook.com/dinhphuong205/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-green font-semibold hover:underline hover:text-brand-green-hover transition-colors"
            >
              Kim Đình Phương
            </a>
          </p>
        </div>

      </div>
    </footer>
  );
}

