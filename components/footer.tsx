"use client";

import Image from "next/image";
import { Heart } from "lucide-react";

interface FooterProps {
  customFooterText?: string;
}

export default function Footer({}: FooterProps = {}) {
  return (
    <footer className="w-full mt-auto py-2.5 sm:py-3.5 border-t border-white/[0.06] bg-[#050807]/90 backdrop-blur-xl select-none">
      <div className="max-w-[1600px] mx-auto px-3.5 sm:px-8 lg:px-12 flex flex-row items-center justify-between gap-2 sm:gap-6">
        
        {/* Bên Trái: Ở trên là Logo & Hi PHIM, Ở dưới là Nền tảng xem phim phi lợi nhuận */}
        <div className="flex flex-col items-start text-left gap-0.5 sm:gap-1 min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Image
              src="/favicon.svg"
              alt="Hi Phim Logo"
              width={18}
              height={18}
              className="w-4 h-4 sm:w-5 sm:h-5 object-contain shrink-0"
            />
            <span className="text-xs sm:text-sm font-black text-white tracking-wide truncate">
              Hi <span className="text-brand-green">PHIM</span>
            </span>
          </div>

          <p className="text-[9.5px] sm:text-[11px] text-white/40 leading-tight">
            Nền tảng xem phim phi lợi nhuận.
          </p>
        </div>

        {/* Bên Phải: Ở trên là Copyright, Ở dưới là Người phát triển */}
        <div className="flex flex-col items-end text-right gap-0.5 sm:gap-1 shrink-0">
          <p className="text-[9.5px] sm:text-[11px] font-medium text-white/45 leading-tight">
            © 2025 - 2026 <span className="text-white/70 font-semibold">Hi PHIM</span>
          </p>

          <p className="text-[9.5px] sm:text-[11px] text-white/60 leading-tight">
            Phát triển bởi{" "}
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

