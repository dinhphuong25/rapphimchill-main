"use client";

import { memo, useState, useEffect } from "react";
import Link from "next/link";
import { Mail, Scale, Shield, X } from "lucide-react";
import BrandLogo from "@/components/ui/brand-logo";

interface FooterProps {
  customFooterText?: string;
}

function FooterComponent({ customFooterText }: FooterProps = {}) {
  const [activeModal, setActiveModal] = useState<"terms" | "privacy" | null>(null);

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveModal(null);
      }
    };
    if (activeModal) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeModal]);

  return (
    <footer className="w-full mt-auto mb-0 select-none text-cinema-text px-3.5 sm:px-6 pb-28 lg:pb-10 pt-6">
      {/* Footer Card Container matching Hi Download */}
      <div className="w-full max-w-[1200px] mx-auto rounded-2xl sm:rounded-3xl border border-white/10 bg-[#0C130F]/90 backdrop-blur-xl shadow-[0_10px_35px_rgba(0,0,0,0.6)] p-6 sm:p-8">
        {/* Top Row: Brand Info (Left) + Quick Navigation Links (Right) */}
        <div className="flex flex-col md:flex-row items-center md:justify-between gap-5 text-center md:text-left">
          {/* Left: Brand Identity & Tagline */}
          <div className="flex flex-col items-center md:items-start max-w-[500px]">
            <Link
              href="/"
              className="flex items-center gap-2 cursor-pointer hover:opacity-90 transition-opacity"
              aria-label="Về trang chủ Hi Phim"
            >
              <BrandLogo size="md" showSlogan={false} />
            </Link>
            <p className="text-[13px] sm:text-[13.5px] text-white/60 font-medium leading-relaxed mt-2 text-center md:text-left">
              {customFooterText || "Nền tảng xem phim trực tuyến miễn phí phi lợi nhuận."}
            </p>
          </div>

          {/* Right: Quick Links (Liên Hệ | Điều Khoản | Bảo Mật) */}
          <div className="flex items-center justify-center flex-wrap gap-3.5 sm:gap-4.5 text-[13px] sm:text-[13.5px] font-bold text-white/85">
            {/* 1. Liên Hệ */}
            <a
              href="https://www.facebook.com/dinhphuong205/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 hover:text-brand-green transition-colors cursor-pointer group"
              title="Liên hệ Facebook Kim Đình Phương"
            >
              <Mail className="w-4 h-4 text-brand-green shrink-0 group-hover:scale-110 transition-transform" />
              <span>Liên Hệ</span>
            </a>

            {/* Divider */}
            <div className="w-[1.5px] h-3.5 bg-white/20 hidden xs:block" />

            {/* 2. Điều Khoản */}
            <button
              type="button"
              onClick={() => setActiveModal("terms")}
              className="flex items-center gap-1.5 hover:text-brand-green transition-colors cursor-pointer group"
              title="Xem Điều khoản sử dụng"
            >
              <Scale className="w-4 h-4 text-brand-green shrink-0 group-hover:scale-110 transition-transform" />
              <span>Điều Khoản</span>
            </button>

            {/* Divider */}
            <div className="w-[1.5px] h-3.5 bg-white/20 hidden xs:block" />

            {/* 3. Bảo Mật */}
            <button
              type="button"
              onClick={() => setActiveModal("privacy")}
              className="flex items-center gap-1.5 hover:text-brand-green transition-colors cursor-pointer group"
              title="Xem Chính sách bảo mật"
            >
              <Shield className="w-4 h-4 text-brand-green shrink-0 group-hover:scale-110 transition-transform" />
              <span>Bảo Mật</span>
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-white/10 my-5 sm:my-6" />

        {/* Bottom Row: Copyright & Developer Info */}
        <div className="text-center space-y-1 sm:space-y-1.5">
          <p className="text-[13px] text-white/85 font-semibold">
            © 2026 Hi Phim. Toàn quyền được bảo lưu.
          </p>
          <p className="text-[12.5px] text-white/50 font-medium">
            Được thành lập và phát triển bởi{" "}
            <a
              href="https://www.facebook.com/dinhphuong205/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-green font-bold hover:underline transition-colors"
            >
              Kim Đình Phương
            </a>
          </p>
        </div>
      </div>

      {/* Terms of Service Modal */}
      {activeModal === "terms" && (
        <div
          className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="w-full max-w-lg bg-[#0F1712] border border-white/15 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto custom-scrollbar animate-in zoom-in-95 duration-200 text-left select-text"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-brand-green" />
                <h3 className="text-base sm:text-lg font-bold text-white">Điều Khoản Sử Dụng</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Đóng"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs sm:text-[13px] text-white/70 space-y-3 leading-relaxed">
              <p>
                Chào mừng bạn đến với <strong>Hi Phim</strong>. Khi truy cập và sử dụng dịch vụ của chúng tôi, bạn đồng ý tuân thủ các điều khoản sau:
              </p>
              <div>
                <h4 className="font-bold text-white text-[13.5px] mb-1">1. Mục đích hoạt động</h4>
                <p>
                  Hi Phim là một nền tảng phi lợi nhuận, được xây dựng nhằm mục đích học tập, nghiên cứu công nghệ và phục vụ cộng đồng xem phim giải trí hoàn toàn miễn phí.
                </p>
              </div>
              <div>
                <h4 className="font-bold text-white text-[13.5px] mb-1">2. Bản quyền nội dung</h4>
                <p>
                  Tất cả các nội dung phim ảnh, hình ảnh và video trên website đều được tổng hợp tự động từ các nguồn công khai trên Internet. Hi Phim không trực tiếp lưu trữ hay sở hữu bất kỳ tệp video vi phạm bản quyền nào trên máy chủ riêng.
                </p>
              </div>
              <div>
                <h4 className="font-bold text-white text-[13.5px] mb-1">3. Trách nhiệm người dùng</h4>
                <p>
                  Người dùng cam kết không sử dụng trang web cho các mục đích thương mại trái phép, không tấn công phá hoại hạ tầng mạng hoặc can thiệp tiêu cực vào trải nghiệm của người khác.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-white/10 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 rounded-xl bg-brand-green text-[#051309] font-bold text-xs sm:text-sm hover:opacity-90 active:scale-95 transition-all cursor-pointer"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Policy Modal */}
      {activeModal === "privacy" && (
        <div
          className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="w-full max-w-lg bg-[#0F1712] border border-white/15 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto custom-scrollbar animate-in zoom-in-95 duration-200 text-left select-text"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-brand-green" />
                <h3 className="text-base sm:text-lg font-bold text-white">Chính Sách Bảo Mật</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Đóng"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs sm:text-[13px] text-white/70 space-y-3 leading-relaxed">
              <p>
                Hi Phim coi trọng quyền riêng tư của người dùng và cam kết bảo mật thông tin tối đa:
              </p>
              <div>
                <h4 className="font-bold text-white text-[13.5px] mb-1">1. Dữ liệu cá nhân</h4>
                <p>
                  Chúng tôi không bắt buộc người dùng phải cung cấp thông tin cá nhân nhạy cảm khi xem phim. Bạn hoàn toàn có thể thưởng thức nội dung với tư cách Khách.
                </p>
              </div>
              <div>
                <h4 className="font-bold text-white text-[13.5px] mb-1">2. Lưu trữ cục bộ & Cookie</h4>
                <p>
                  Dữ liệu lịch sử xem, danh sách phim yêu thích và tiến trình tập phim được lưu trữ an toàn trong trình duyệt (LocalStorage) của thiết bị bạn đang dùng để mang lại trải nghiệm tiện lợi nhất.
                </p>
              </div>
              <div>
                <h4 className="font-bold text-white text-[13.5px] mb-1">3. Cam kết an toàn</h4>
                <p>
                  Hi Phim cam kết không bán, trao đổi hoặc chia sẻ bất kỳ dữ liệu cá nhân nào của bạn cho bên thứ ba vì mục đích quảng cáo hoặc theo dõi người dùng.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-white/10 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 rounded-xl bg-brand-green text-[#051309] font-bold text-xs sm:text-sm hover:opacity-90 active:scale-95 transition-all cursor-pointer"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
}

export default memo(FooterComponent);
