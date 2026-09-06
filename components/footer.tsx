"use client";

import Image from "next/image";
import { Heart } from "lucide-react";

interface FooterProps {
  customFooterText?: string;
}

export default function Footer({ customFooterText }: FooterProps = {}) {
  return (
    <footer className="w-full mt-auto py-3 sm:py-3.5 border-t border-white/[0.06] bg-[#050807]/90 backdrop-blur-xl select-none">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 flex flex-col md:flex-row items-center justify-between gap-2.5 md:gap-6">
        
        {/* Bên Trái: Logo, Thương hiệu & Tuyên bố nguồn mở */}
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2 shrink-0">
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

          <span className="text-white/20 hidden sm:inline">•</span>

          <p className="text-[11px] text-white/40 max-w-xl leading-relaxed">
            Tổng hợp & nhúng video từ các nguồn mở Internet. Không lưu trữ tập tin trên máy chủ.
          </p>
        </div>

        {/* Bên Phải: Bản quyền & Nhà phát triển */}
        <div className="flex flex-col sm:flex-row items-center gap-1.5 sm:gap-3 text-center sm:text-right shrink-0">
          {customFooterText && (
            <span className="text-[11px] text-brand-green/80 font-medium hidden xl:inline">
              {customFooterText}
            </span>
          )}

          <p className="text-[11px] font-medium text-white/40">
            © 2025 - 2026 <span className="text-white/60">Hi PHIM</span>. All rights reserved.
          </p>

          <span className="text-white/20 hidden sm:inline">•</span>

          <p className="text-[11px] text-white/60">
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

