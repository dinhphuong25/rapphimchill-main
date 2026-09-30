import { memo } from "react";

interface FooterProps {
  customFooterText?: string;
}

function FooterComponent({ customFooterText }: FooterProps = {}) {
  return (
    <footer className="w-full mt-auto mb-0 border-t border-white/[0.08] bg-[#050807] select-none text-cinema-text">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-8 lg:px-12 py-3.5 sm:py-4 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-[11.5px] text-white/50">
        <p>
          © 2025 Hi Phim. Mọi bản quyền được bảo lưu.
        </p>

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
