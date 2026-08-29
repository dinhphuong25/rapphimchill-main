"use client";

import Script from "next/script";

export default function Footer() {
  return (
    <footer className="w-full mt-auto pt-6 pb-28 md:py-8 border-t border-white/5 bg-cinema-bg/80 backdrop-blur-md">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          {/* Left Info / Copyright */}
          <div className="space-y-1.5">
            <p className="text-xs sm:text-sm text-gray-300">
              Được quản lý và phát triển bởi{" "}
              <a
                href="https://www.facebook.com/dinhphuongkim.vn/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary font-semibold hover:underline hover:text-primary/80 transition-colors"
              >
                Kim Đình Phương
              </a>
            </p>
            <p className="text-[11px] sm:text-xs text-gray-500 font-medium">
              © 2025 - 2026 Rạp Phim Chill. All rights reserved.
            </p>
          </div>

          {/* Right DMCA Protection Badge */}
          <div className="flex items-center justify-center sm:justify-end shrink-0 pt-1 sm:pt-0">
            <a
              href="https://www.dmca.com/Protection/Status.aspx?ID=5a1e0cc9-8158-46c6-97a7-ba374504dcb5"
              title="DMCA.com Protection Status"
              className="dmca-badge inline-block transition-all hover:scale-105 active:scale-95 duration-200"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src="https://images.dmca.com/Badges/dmca-badge-w150-2x1-01.png?ID=5a1e0cc9-8158-46c6-97a7-ba374504dcb5"
                alt="DMCA.com Protection Status"
                className="h-7 sm:h-8 w-auto object-contain rounded shadow-sm hover:shadow-[0_0_12px_rgba(34,197,94,0.3)] transition-all"
                loading="lazy"
              />
            </a>
          </div>
        </div>
      </div>

      <Script src="https://images.dmca.com/Badges/DMCABadgeHelper.min.js" strategy="lazyOnload" />
    </footer>
  );
}
