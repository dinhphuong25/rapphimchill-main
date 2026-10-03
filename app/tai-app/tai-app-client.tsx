"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Smartphone,
  Download,
  Apple,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ExternalLink,
  HelpCircle,
  Sparkles,
  Zap,
  Film,
  Layers,
  ChevronRight,
  ArrowRight,
  Info,
  Tv,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Links & Artifacts (EAS Observe Integrated Builds)
const IOS_IPA_DOWNLOAD_URL =
  "https://expo.dev/artifacts/eas/LA1x2PlnF7SJ6nYt5l2HR60fPJe6crXVC4LERhkO8d4.ipa";
const IOS_INSTALL_PAGE_URL =
  "https://expo.dev/accounts/dinhphuongkim/projects/hiphim-mobile/builds/136a3607-54dc-4cad-a614-d69a779b33a0";
const ANDROID_APK_DOWNLOAD_URL =
  "https://expo.dev/artifacts/eas/kpg96Rywf2HL8M7PTjBRjUKUgpXPHVv7bKCgwLwD_68.apk";
const ANDROID_BUILD_PAGE_URL =
  "https://expo.dev/accounts/dinhphuongkim/projects/hiphim-mobile/builds/5302f13b-590f-4fbc-b2a0-3e49b2b8694c";

export default function TaiAppClient() {
  const [activePlatform, setActivePlatform] = useState<"ios" | "android">("ios");
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyLink = (url: string) => {
    try {
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      toast.success("Đã sao chép link tải vào bộ nhớ tạm!");
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      toast.error("Không thể sao chép liên kết.");
    }
  };

  const currentQrUrl =
    activePlatform === "ios"
      ? `https://api.qrserver.com/v1/create-qr-code/?size=280x280&color=20-214-107&bgcolor=5-8-7&data=${encodeURIComponent(
          IOS_INSTALL_PAGE_URL
        )}`
      : `https://api.qrserver.com/v1/create-qr-code/?size=280x280&color=20-214-107&bgcolor=5-8-7&data=${encodeURIComponent(
          ANDROID_BUILD_PAGE_URL
        )}`;

  return (
    <div className="min-h-screen bg-[#050807] text-white pt-20 sm:pt-24 lg:pt-28 pb-24 selection:bg-[#20D66B]/30 selection:text-[#20D66B]">
      {/* Ambient Top Glow Effect */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-80 bg-gradient-to-b from-[#20D66B]/12 via-[#20D66B]/5 to-transparent blur-3xl pointer-events-none -z-10" />

      <main className="w-full max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Đường dẫn trang" className="mb-6 flex items-center gap-2 text-xs text-white/50">
          <Link href="/" className="hover:text-white transition-colors">
            Trang Chủ
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-white/30" />
          <span className="text-[#20D66B] font-semibold">Tải Ứng Dụng Mobile</span>
        </nav>

        {/* Hero Section */}
        <div className="relative text-center max-w-3xl mx-auto mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#20D66B]/10 border border-[#20D66B]/30 text-[#20D66B] text-xs font-bold uppercase tracking-wider mb-4 shadow-[0_0_15px_rgba(32,214,107,0.2)]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Ứng Dụng Chính Thức • Hi Phim Mobile</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white mb-4">
            Rạp Phim Bỏ Túi{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#20D66B] via-emerald-300 to-[#20D66B]">
              Mọi Lúc, Mọi Nơi
            </span>
          </h1>

          <p className="text-sm sm:text-base text-white/60 leading-relaxed max-w-2xl mx-auto">
            Tận hưởng hàng chục ngàn bộ phim bom tấn chiếu rạp, phim bộ, phim lẻ độ phân giải cao Full HD, tự động nhớ tập và giây xem dở, load tức thì không độ trễ.
          </p>

          {/* Quick Feature Badges */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 mt-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 text-xs text-white/80 font-medium">
              <Zap className="w-3 h-3 text-[#20D66B]" /> Tốc độ truyền tải HLS cực nhanh
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 text-xs text-white/80 font-medium">
              <ShieldCheck className="w-3 h-3 text-emerald-400" /> Không quảng cáo phiền toái
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 text-xs text-white/80 font-medium">
              <Film className="w-3 h-3 text-amber-400" /> Tự lưu lịch sử & yêu thích
            </span>
          </div>
        </div>

        {/* Platform Switcher Tabs */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex p-1.5 bg-[#0C1310] border border-white/10 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.6)]">
            <button
              type="button"
              onClick={() => setActivePlatform("ios")}
              className={cn(
                "flex items-center gap-2.5 px-6 sm:px-8 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer select-none",
                activePlatform === "ios"
                  ? "bg-gradient-to-r from-[#20D66B] to-emerald-400 text-black shadow-[0_0_20px_rgba(32,214,107,0.4)]"
                  : "text-white/65 hover:text-white hover:bg-white/5"
              )}
            >
              <Apple className="w-4 h-4 fill-current" />
              <span>Apple iOS (.IPA)</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/20 text-current uppercase">
                iPhone / iPad
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActivePlatform("android")}
              className={cn(
                "flex items-center gap-2.5 px-6 sm:px-8 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer select-none",
                activePlatform === "android"
                  ? "bg-gradient-to-r from-[#20D66B] to-emerald-400 text-black shadow-[0_0_20px_rgba(32,214,107,0.4)]"
                  : "text-white/65 hover:text-white hover:bg-white/5"
              )}
            >
              <Smartphone className="w-4 h-4" />
              <span>Android (.APK)</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/20 text-current uppercase">
                Phổ biến
              </span>
            </button>
          </div>
        </div>

        {/* Main Download Card & QR Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-16">
          {/* Left Column: Download Action Center */}
          <div className="lg:col-span-7 bg-gradient-to-b from-[#0C1310] to-[#070B09] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.7)] relative overflow-hidden">
            {/* Ambient Corner Accent */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#20D66B]/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#20D66B]/15 border border-[#20D66B]/30 flex items-center justify-center text-[#20D66B] shadow-[0_0_15px_rgba(32,214,107,0.25)]">
                    {activePlatform === "ios" ? (
                      <Apple className="w-6 h-6 fill-current" />
                    ) : (
                      <Smartphone className="w-6 h-6" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white">
                      Hi Phim Mobile{" "}
                      <span className="text-[#20D66B]">
                        {activePlatform === "ios" ? "cho iOS" : "cho Android"}
                      </span>
                    </h2>
                    <p className="text-xs text-white/50 mt-0.5">
                      Phiên bản 1.0.0 • Định dạng{" "}
                      {activePlatform === "ios" ? ".IPA (iOS App Archive)" : ".APK (Android Package)"}
                    </p>
                  </div>
                </div>

                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono font-bold text-[#20D66B] bg-[#20D66B]/10 border border-[#20D66B]/25 px-2.5 py-1 rounded-full">
                  <CheckCircle2 className="w-3 h-3" /> Hoạt động 100%
                </span>
              </div>

              {activePlatform === "ios" ? (
                /* iOS Action Options */
                <div className="space-y-4 mb-8">
                  {/* Primary Direct IPA Download */}
                  <a
                    href={IOS_IPA_DOWNLOAD_URL}
                    download="hiphim.ipa"
                    className="w-full flex items-center justify-between px-5 py-4 rounded-2xl bg-gradient-to-r from-[#20D66B] to-emerald-400 hover:from-emerald-400 hover:to-[#20D66B] text-black font-extrabold shadow-[0_0_25px_rgba(32,214,107,0.35)] transition-all transform active:scale-[0.99] group cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-black/20 flex items-center justify-center text-black group-hover:scale-110 transition-transform shrink-0">
                        <Download className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <div className="text-sm font-black tracking-tight leading-tight">
                          Tải Trực Tiếp File .IPA
                        </div>
                        <div className="text-[11px] font-semibold text-black/75 mt-0.5">
                          Dành cho TrollStore, Scarlet, ESign, Sideloadly
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform shrink-0" />
                  </a>

                  {/* Secondary Expo Online Install */}
                  <a
                    href={IOS_INSTALL_PAGE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-between px-5 py-3.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-[#20D66B]/40 text-white font-bold transition-all group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <ExternalLink className="w-4 h-4 text-[#20D66B]" />
                      <div className="text-left">
                        <div className="text-xs sm:text-sm font-bold text-white group-hover:text-[#20D66B] transition-colors">
                          Mở Trang Cài Đặt Trực Tuyến (Expo Cloud)
                        </div>
                        <div className="text-[11px] text-white/45">
                          Tự động nhận diện thiết bị & hướng dẫn cài
                        </div>
                      </div>
                    </div>
                    <span className="text-xs text-white/50 group-hover:text-white font-mono">
                      Mở tab mới
                    </span>
                  </a>
                </div>
              ) : (
                /* Android Action Options */
                <div className="space-y-4 mb-8">
                  {/* Primary Direct APK Download */}
                  <a
                    href={ANDROID_APK_DOWNLOAD_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-between px-5 py-4 rounded-2xl bg-gradient-to-r from-[#20D66B] to-emerald-400 hover:from-emerald-400 hover:to-[#20D66B] text-black font-extrabold shadow-[0_0_25px_rgba(32,214,107,0.35)] transition-all transform active:scale-[0.99] group cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-black/20 flex items-center justify-center text-black group-hover:scale-110 transition-transform shrink-0">
                        <Download className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <div className="text-sm font-black tracking-tight leading-tight">
                          Tải File .APK Cài Đặt Android
                        </div>
                        <div className="text-[11px] font-semibold text-black/75 mt-0.5">
                          Tương thích Android 8.0 trở lên (Samsung, Xiaomi, Oppo...)
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform shrink-0" />
                  </a>

                  {/* Secondary Build Link */}
                  <a
                    href={ANDROID_BUILD_PAGE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-between px-5 py-3.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-[#20D66B]/40 text-white font-bold transition-all group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <ExternalLink className="w-4 h-4 text-[#20D66B]" />
                      <div className="text-left">
                        <div className="text-xs sm:text-sm font-bold text-white group-hover:text-[#20D66B] transition-colors">
                          Trang Đóng Gói Tự Động EAS Cloud
                        </div>
                        <div className="text-[11px] text-white/45">
                          Theo dõi build & cập nhật bản mới nhất
                        </div>
                      </div>
                    </div>
                    <span className="text-xs text-white/50 group-hover:text-white font-mono">
                      Mở tab mới
                    </span>
                  </a>
                </div>
              )}

              {/* Share & Copy Link Strip */}
              <div className="pt-4 border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-white/50 truncate max-w-[280px] sm:max-w-none font-mono">
                  {activePlatform === "ios" ? IOS_IPA_DOWNLOAD_URL : ANDROID_APK_DOWNLOAD_URL}
                </div>
                <button
                  type="button"
                  onClick={() =>
                    handleCopyLink(
                      activePlatform === "ios" ? IOS_IPA_DOWNLOAD_URL : ANDROID_APK_DOWNLOAD_URL
                    )
                  }
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/10 text-white/80 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#20D66B]" />
                      <span className="text-[#20D66B]">Đã chép link</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Sao chép link</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Scan QR Code Card */}
          <div className="lg:col-span-5 bg-gradient-to-b from-[#0C1310] to-[#070B09] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.7)] flex flex-col items-center text-center">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#20D66B] mb-2 flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5" /> Quét Mã Tải Nhanh
            </span>
            <h3 className="text-lg font-black text-white mb-1">
              Quét bằng Camera điện thoại
            </h3>
            <p className="text-xs text-white/50 mb-6">
              Mở ứng dụng Camera trên iPhone hoặc Android để quét mã và mở link tải ngay lập tức.
            </p>

            {/* QR Code Container with Emerald Frame */}
            <div className="relative p-3.5 rounded-2xl bg-[#050807] border-2 border-[#20D66B]/40 shadow-[0_0_30px_rgba(32,214,107,0.2)] mb-5">
              <div className="w-[180px] h-[180px] sm:w-[200px] sm:h-[200px] relative bg-black flex items-center justify-center rounded-xl overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={currentQrUrl}
                  alt={`Mã QR tải ứng dụng Hi Phim ${activePlatform}`}
                  width={200}
                  height={200}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="absolute -top-1.5 -left-1.5 w-3 h-3 border-t-2 border-l-2 border-[#20D66B]" />
              <div className="absolute -top-1.5 -right-1.5 w-3 h-3 border-t-2 border-r-2 border-[#20D66B]" />
              <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 border-b-2 border-l-2 border-[#20D66B]" />
              <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 border-b-2 border-r-2 border-[#20D66B]" />
            </div>

            <p className="text-[11px] text-white/40">
              Không cần đăng ký trước • Miễn phí 100% trọn đời
            </p>
          </div>
        </div>

        {/* Detailed Installation Guides Section */}
        <section aria-labelledby="guide-title" className="mb-16">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 id="guide-title" className="text-2xl sm:text-3xl font-black text-white mb-2">
              Hướng Dẫn Cài Đặt Chi Tiết
            </h2>
            <p className="text-xs sm:text-sm text-white/50">
              Các bước đơn giản để đưa ứng dụng Hi Phim lên màn hình điện thoại của bạn
            </p>
          </div>

          {activePlatform === "ios" ? (
            /* iOS Installation Guides */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Method 1: Sideloading (Scarlet / TrollStore / ESign) */}
              <div className="bg-[#0C1310] border border-white/10 rounded-3xl p-6 sm:p-7 relative overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-bold mb-4">
                    <span>Cách 1 • Phổ Biến Nhất</span>
                  </div>
                  <h3 className="text-lg font-black text-white mb-2 flex items-center gap-2">
                    Cài qua TrollStore, Scarlet, ESign, hoặc Sideloadly
                  </h3>
                  <p className="text-xs text-white/55 mb-6 leading-relaxed">
                    Dành cho các thiết bị iPhone sử dụng công cụ ký ứng dụng trực tiếp hoặc đã có sẵn môi trường sideload.
                  </p>

                  <ol className="space-y-4 text-xs sm:text-sm text-white/80">
                    <li className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-[#20D66B]/20 text-[#20D66B] font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                        1
                      </span>
                      <span>
                        Bấm nút <strong>&ldquo;Tải Trực Tiếp File .IPA&rdquo;</strong> ở trên để lưu file <code>hiphim.ipa</code> vào máy.
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-[#20D66B]/20 text-[#20D66B] font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                        2
                      </span>
                      <span>
                        Mở ứng dụng sideload của bạn (như <strong>Scarlet</strong>, <strong>TrollStore</strong>, <strong>ESign</strong>, hoặc <strong>AltStore</strong>).
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-[#20D66B]/20 text-[#20D66B] font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                        3
                      </span>
                      <span>
                        Nhấn nút <strong>Nhập (Import)</strong> hoặc biểu tượng dấu cộng <code>+</code>, chọn file <code>hiphim.ipa</code> vừa tải về.
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-[#20D66B]/20 text-[#20D66B] font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                        4
                      </span>
                      <span>
                        Xác nhận <strong>Cài đặt (Install)</strong>. Sau khoảng 5 giây, biểu tượng Hi Phim sẽ xuất hiện trên màn hình chính!
                      </span>
                    </li>
                  </ol>
                </div>

                <div className="mt-6 pt-4 border-t border-white/5 flex items-center gap-2 text-xs text-white/45">
                  <Info className="w-4 h-4 text-[#20D66B] shrink-0" />
                  <span>File IPA đã được cấu hình bundleID tối ưu không giới hạn thời gian chạy.</span>
                </div>
              </div>

              {/* Method 2: Trust Enterprise/Developer Certificate */}
              <div className="bg-[#0C1310] border border-white/10 rounded-3xl p-6 sm:p-7 relative overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-400 text-xs font-bold mb-4">
                    <span>Cách 2 • Cài Đặt Trực Tiếp</span>
                  </div>
                  <h3 className="text-lg font-black text-white mb-2 flex items-center gap-2">
                    Xác Thực Tin Cậy Chứng Chỉ (Trust Developer)
                  </h3>
                  <p className="text-xs text-white/55 mb-6 leading-relaxed">
                    Nếu bạn mở app lần đầu và nhận được thông báo <em>&ldquo;Nhà phát triển doanh nghiệp chưa đáng tin cậy&rdquo;</em>, hãy làm theo các bước sau:
                  </p>

                  <ol className="space-y-4 text-xs sm:text-sm text-white/80">
                    <li className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-amber-400/20 text-amber-400 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                        1
                      </span>
                      <span>
                        Mở ứng dụng <strong>Cài đặt (Settings)</strong> trên iPhone hoặc iPad.
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-amber-400/20 text-amber-400 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                        2
                      </span>
                      <span>
                        Chọn mục <strong>Cài đặt chung (General)</strong> &rarr; kéo xuống chọn <strong>Quản lý VPN & Thiết bị (VPN & Device Management)</strong>.
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-amber-400/20 text-amber-400 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                        3
                      </span>
                      <span>
                        Tại mục <strong>Ứng dụng doanh nghiệp (Enterprise App)</strong>, nhấn vào tên nhà phát triển liên kết với app.
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-amber-400/20 text-amber-400 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                        4
                      </span>
                      <span>
                        Nhấn nút <strong>Tin cậy &ldquo;...&rdquo; (Trust)</strong> và bấm xác nhận. Bây giờ bạn có thể mở ứng dụng xem phim mượt mà!
                      </span>
                    </li>
                  </ol>
                </div>

                <div className="mt-6 pt-4 border-t border-white/5 flex items-center gap-2 text-xs text-white/45">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Chỉ cần xác thực 1 lần duy nhất cho mỗi chứng chỉ cài đặt.</span>
                </div>
              </div>
            </div>
          ) : (
            /* Android Installation Guides */
            <div className="max-w-2xl mx-auto bg-[#0C1310] border border-white/10 rounded-3xl p-6 sm:p-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-bold mb-4">
                <span>Cài Đặt Dễ Dàng • 3 Bước Đơn Giản</span>
              </div>
              <h3 className="text-xl font-black text-white mb-2">
                Hướng dẫn cài đặt file .APK trên điện thoại Android
              </h3>
              <p className="text-xs sm:text-sm text-white/55 mb-6 leading-relaxed">
                Tệp APK là định dạng cài đặt tiêu chuẩn và an toàn của hệ điều hành Android. Bạn có thể cài trực tiếp mà không cần qua Google Play Store.
              </p>

              <ol className="space-y-4 text-xs sm:text-sm text-white/80">
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#20D66B]/20 text-[#20D66B] font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </span>
                  <span>
                    Bấm nút <strong>&ldquo;Tải File .APK&rdquo;</strong> ở trên để tải gói cài đặt về điện thoại của bạn.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#20D66B]/20 text-[#20D66B] font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </span>
                  <span>
                    Khi tải xong, mở file từ thanh thông báo hoặc thư mục <strong>Tệp tải về (Downloads)</strong>.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#20D66B]/20 text-[#20D66B] font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                    3
                  </span>
                  <span>
                    Nếu xuất hiện thông báo bảo mật <em>&ldquo;Cho phép cài đặt ứng dụng từ nguồn không xác định&rdquo;</em>, hãy bấm <strong>Cài đặt (Settings)</strong> và bật <strong>Cho phép</strong>, sau đó quay lại bấm <strong>Cài đặt (Install)</strong>.
                  </span>
                </li>
              </ol>
            </div>
          )}
        </section>

        {/* Feature Highlights Grid */}
        <section aria-labelledby="features-title" className="mb-16">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 id="features-title" className="text-2xl sm:text-3xl font-black text-white mb-2">
              Trải Nghiệm Điện Ảnh Đỉnh Cao Trên Mobile
            </h2>
            <p className="text-xs sm:text-sm text-white/50">
              Được thiết kế tỉ mỉ mang lại trải nghiệm xem phim hoàn hảo nhất
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <div className="p-6 rounded-2xl bg-[#0C1310] border border-white/[0.08] hover:border-[#20D66B]/30 transition-all">
              <div className="w-10 h-10 rounded-xl bg-[#20D66B]/15 border border-[#20D66B]/30 flex items-center justify-center text-[#20D66B] mb-4">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Truyền Tải Siêu Tốc HLS</h3>
              <p className="text-xs text-white/50 leading-relaxed">
                Máy chủ băng thông rộng phát m3u8 phân giải cao Full HD/4K mượt mà, không giật lag ngay cả trên mạng di động 4G/5G.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#0C1310] border border-white/[0.08] hover:border-[#20D66B]/30 transition-all">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4">
                <Film className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Tự Động Nhớ Giây Đang Xem</h3>
              <p className="text-xs text-white/50 leading-relaxed">
                Xem dở bất kỳ lúc nào, khi mở lại app sẽ tự động nhảy đến đúng tập và số giây bạn đã dừng mà không phải tua lại.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#0C1310] border border-white/[0.08] hover:border-[#20D66B]/30 transition-all">
              <div className="w-10 h-10 rounded-xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-400 mb-4">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Đồng Bộ Yêu Thích & Lịch Sử</h3>
              <p className="text-xs text-white/50 leading-relaxed">
                Dù bạn dùng ở chế độ khách hay đăng nhập tài khoản, dữ liệu xem phim luôn được bảo toàn và đồng bộ đám mây liên tục.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
