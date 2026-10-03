import { memo } from "react";
import Link from "next/link";
import { Smartphone } from "lucide-react";

interface FooterProps {
  customFooterText?: string;
}

function FooterComponent({ customFooterText }: FooterProps = {}) {
  return (
    <footer className="w-full mt-auto mb-0 border-t border-white/[0.08] bg-[#050807] select-none text-cinema-text">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-8 lg:px-12 py-3.5 sm:py-4 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-[11.5px] text-white/50">
        <div className="flex items-center gap-3">
          <p>© 2025 Hi Phim. Mọi bản quyền được bảo lưu.</p>
          <span className="text-white/20">•</span>
          <Link
            href="/tai-app"
            className="inline-flex items-center gap-1 text-[#20D66B] hover:underline font-semibold transition-colors"
          >
            <Smartphone className="w-3 h-3" />
            Tải App (iOS & Android)
          </Link>
        </div>

        <p>
          Phát triển & vận hành bởi{" "}
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
    </footer>
  );
}

export default memo(FooterComponent);
