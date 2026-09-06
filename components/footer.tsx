"use client";

import Image from "next/image";
import { Heart } from "lucide-react";

interface FooterProps {
  customFooterText?: string;
}

export default function Footer({}: FooterProps = {}) {
  return (
    <footer className="w-full mt-auto py-3.5 sm:py-4 border-t border-white/[0.08] bg-[#050807]/95 backdrop-blur-xl select-none">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 flex flex-row items-center justify-between gap-3 sm:gap-6">
        
        {/* Bên Trái: Ở trên là Logo & Hi PHIM, Ở dưới là Nền tảng xem phim phi lợi nhuận */}
        <div className="flex flex-col items-start text-left gap-1 min-w-0">
          <div className="flex items-center gap-2">
            <Image
              src="/favicon.svg"
              alt="Hi Phim Logo"
              width={20}
              height={20}
              className="w-5 h-5 sm:w-5 sm:h-5 object-contain shrink-0"
            />
            <span className="text-sm sm:text-base font-black text-white tracking-wide truncate">
              Hi <span className="text-brand-green">PHIM</span>
            </span>
          </div>

          <p className="text-[11px] sm:text-[12px] text-white/60 leading-normal">
            Nền tảng xem phim phi lợi nhuận.
          </p>
        </div>

        {/* Bên Phải: Bản quyền & Người phát triển (2 dòng đối xứng với bên trái) */}
        <div className="flex flex-col items-end text-right gap-1 shrink-0 max-w-[65%] sm:max-w-none">
          {/* Dòng 1: Copyright, Mọi bản quyền được bảo lưu & Miễn trừ trách nhiệm pháp lý chung 1 dòng */}
          <p className="text-[11px] sm:text-[12px] font-medium text-white/60 leading-normal">
            © 2025 Hi PHIM. Mọi bản quyền được bảo lưu và miễn trừ trách nhiệm pháp lý.
          </p>

          {/* Dòng 2: Người phát triển */}
          <p className="text-[11px] sm:text-[12px] text-white/70 leading-normal">
            Phát triển bởi{" "}
            <a
              href="https://www.facebook.com/dinhphuong205/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-green font-bold hover:underline hover:text-brand-green-hover transition-colors"
            >
              Kim Đình Phương
            </a>
          </p>
        </div>

      </div>
    </footer>
  );
}

