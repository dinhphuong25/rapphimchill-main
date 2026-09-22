import { memo } from "react";
import BrandLogo from "@/components/ui/brand-logo";
import Script from "next/script";

interface FooterProps {
  customFooterText?: string;
}

function FooterComponent({}: FooterProps = {}) {
  return (
    <footer className="w-full mt-auto py-5 sm:py-6 mb-20 lg:mb-0 border-t border-white/[0.08] bg-[#050807] select-none">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 flex flex-col items-center justify-center text-center gap-3.5">
        
        {/* Phần 1 (Desktop only): Logo & Slogan - Căn giữa */}
        <div className="hidden md:flex flex-col items-center text-center gap-1">
          <div className="flex items-center justify-center gap-2">
            <BrandLogo size="sm" showSlogan={false} />
          </div>

          <p className="text-[11px] sm:text-[12px] text-white/60 leading-normal">
            Nền tảng xem phim phi lợi nhuận.
          </p>
        </div>

        {/* Phần 2: Bản quyền, Người quản lý & Badges (Căn giữa toàn diện cả Desktop & Mobile) */}
        <div className="flex flex-col items-center text-center gap-1.5 w-full">
          {/* Dòng 1: Copyright, Bản quyền & Miễn trừ trách nhiệm */}
          <p className="text-[11px] sm:text-[12px] font-medium text-white/60 leading-normal">
            © 2026 Hi Phim. Mọi bản quyền được bảo lưu và miễn trừ trách nhiệm pháp lý.
          </p>

          {/* Dòng 2: Người quản lý & phát triển */}
          <p className="text-[11px] sm:text-[12px] text-white/70 leading-normal">
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

          {/* Dòng 3: Badges Chứng Nhận (DMCA + Đã Thông Báo Bộ Công Thương) nằm dưới dòng Được quản lý - Căn giữa */}
          <div className="flex items-center justify-center gap-3 pt-1">
            {/* DMCA Badge */}
            <a
              href="https://www.dmca.com/Protection/Status.aspx?ID=49260aed-2988-411a-9305-320180b35777"
              title="DMCA.com Protection Status"
              className="dmca-badge inline-flex items-center transition-all duration-200 hover:opacity-80 active:scale-95"
              target="_blank"
              rel="noopener noreferrer"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.dmca.com/Badges/dmca-badge-w150-2x1-01.png?ID=49260aed-2988-411a-9305-320180b35777"
                alt="DMCA.com Protection Status"
                className="h-7 sm:h-8 w-auto object-contain"
                loading="lazy"
              />
            </a>

            {/* Đã Thông Báo Bộ Công Thương */}
            <a
              href="http://online.gov.vn"
              title="Đã thông báo Bộ Công Thương"
              className="inline-flex items-center transition-all duration-200 hover:opacity-80 active:scale-95"
              target="_blank"
              rel="noopener noreferrer"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/bo-cong-thuong.png"
                alt="Đã thông báo Bộ Công Thương"
                className="h-7 sm:h-8 w-auto object-contain rounded-sm"
                loading="lazy"
              />
            </a>
          </div>
        </div>

      </div>

      {/* DMCA Badge Helper Script */}
      <Script
        src="https://images.dmca.com/Badges/DMCABadgeHelper.min.js"
        strategy="lazyOnload"
      />
    </footer>
  );
}

export default memo(FooterComponent);
