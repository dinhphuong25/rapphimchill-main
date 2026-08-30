"use client";

import Script from "next/script";

export default function Footer() {
  return (
    <footer className="w-full mt-auto py-3.5 pb-20 sm:pb-3.5 md:py-5 border-t border-white/5 bg-cinema-bg/80 backdrop-blur-md">
      <div className="container mx-auto px-3 sm:px-6 lg:px-8 max-w-7xl">
        <div className="flex flex-row items-center justify-between gap-3 text-left">
          {/* Left Info / Copyright */}
          <div className="space-y-0.5 min-w-0 pr-2">
            <p className="text-[11px] sm:text-xs text-gray-300 truncate sm:whitespace-normal">
              Được quản lý và phát triển bởi{" "}
              <a
                href="https://www.facebook.com/dinhphuong205/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary font-semibold hover:underline hover:text-primary/80 transition-colors"
              >
                Kim Đình Phương
              </a>
            </p>
            <p className="text-[10px] sm:text-[11px] text-gray-500 font-medium truncate sm:whitespace-normal">
              © 2025 - 2026 Rạp Phim Chill. All rights reserved.
            </p>
          </div>

          {/* Right DMCA Protection Badge */}
          <div className="flex items-center justify-end shrink-0">
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
                className="h-6 sm:h-7.5 w-auto object-contain rounded shadow-sm hover:shadow-[0_0_12px_rgba(34,197,94,0.3)] transition-all"
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
