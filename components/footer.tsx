import { memo } from "react";

interface FooterProps {
  customFooterText?: string;
}

function FooterComponent({ customFooterText }: FooterProps = {}) {
  return (
    <footer className="w-full mt-auto mb-0 border-t border-white/[0.08] bg-[#050807] select-none text-cinema-text">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-8 lg:px-12 pt-5 pb-2.5 sm:py-7 flex flex-col items-center text-center gap-3.5 sm:gap-4">
        
        {/* Tuyên bố miễn trừ trách nhiệm */}
        <p className="text-[11px] sm:text-[11.5px] text-white/45 leading-relaxed max-w-3xl">
          <span className="font-semibold text-white/60">Tuyên bố miễn trừ trách nhiệm:</span> Toàn bộ nội dung video trên website được thu thập tự động từ các nguồn chia sẻ mở công khai trên Internet. Hi Phim không tự lưu trữ hoặc tải lên bất kỳ tệp tin phương tiện nào lên máy chủ của mình. Nếu có bất kỳ thắc mắc hoặc khiếu nại bản quyền, xin vui lòng liên hệ trực tiếp với các đơn vị cung cấp nguồn tương ứng.
        </p>

        {/* Phần dưới: Bản quyền & Nhà phát triển */}
        <div className="w-full pt-4 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-2.5 text-[11.5px] text-white/50">
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

      </div>
    </footer>
  );
}

export default memo(FooterComponent);
