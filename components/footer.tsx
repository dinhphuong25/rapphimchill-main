"use client";

import BrandLogo from "@/components/ui/brand-logo";
import { Heart } from "lucide-react";

interface FooterProps {
  customFooterText?: string;
}

export default function Footer({}: FooterProps = {}) {
  return (
    <footer className="w-full mt-auto py-3.5 sm:py-4 mb-20 lg:mb-0 border-t border-white/[0.08] bg-[#050807] select-none">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-2 sm:gap-6">
        
        {/* Bên Trái (Desktop only): Logo & Slogan */}
        <div className="hidden sm:flex flex-col items-start text-left gap-1 min-w-0">
          <div className="flex items-center gap-2">
            <BrandLogo size="sm" />
          </div>

          <p className="text-[11px] sm:text-[12px] text-white/60 leading-normal">
            Nền tảng xem phim phi lợi nhuận.
          </p>
        </div>

        {/* Bản quyền & Người phát triển (Mobile: Căn giữa, Desktop: Căn phải) */}
        <div className="flex flex-col items-center text-center sm:items-end sm:text-right gap-1 w-full sm:w-auto sm:shrink-0">
          {/* Dòng 1: Copyright, Bản quyền & Miễn trừ trách nhiệm */}
          <p className="text-[11px] sm:text-[12px] font-medium text-white/60 leading-normal">
            © 2025 Hi Phim. Mọi bản quyền được bảo lưu và miễn trừ trách nhiệm pháp lý.
          </p>

          {/* Dòng 2: Người sáng lập & phát triển */}
          <p className="text-[11px] sm:text-[12px] text-white/70 leading-normal">
            Được thành lập và phát triển bởi{" "}
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

