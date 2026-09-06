"use client";

import { useState, useEffect } from "react";
import { Wrench, Shield, RefreshCw, Clock, CheckCircle2, Key, ArrowRight, Film } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function MaintenancePage() {
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number }>({
    hours: 0,
    minutes: 45,
    seconds: 0,
  });
  const [isChecking, setIsChecking] = useState(false);
  const [showAdminBypass, setShowAdminBypass] = useState(false);
  const [bypassToken, setBypassToken] = useState("");
  const [isSubmittingToken, setIsSubmittingToken] = useState(false);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleCheckStatus = async () => {
    setIsChecking(true);
    try {
      const res = await fetch("/api/system/maintenance");
      if (res.ok) {
        const data = await res.json();
        if (!data.enabled) {
          toast.success("Hệ thống đã hoàn tất bảo trì! Đang đưa bạn vào trang chủ...");
          setTimeout(() => {
            window.location.href = "/";
          }, 1000);
          return;
        }
      }
      toast.info("Hệ thống vẫn đang trong quá trình nâng cấp. Vui lòng quay lại sau ít phút!");
    } catch {
      toast.error("Không thể kết nối đến máy chủ. Vui lòng thử lại sau!");
    } finally {
      setIsChecking(false);
    }
  };

  const handleAdminBypassSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bypassToken.trim()) {
      toast.error("Vui lòng nhập mã bảo mật!");
      return;
    }

    setIsSubmittingToken(true);
    try {
      const res = await fetch(`/api/system/maintenance?action=bypass&token=${encodeURIComponent(bypassToken.trim())}`);
      const data = await res.json();
      if (data.success) {
        toast.success("Xác thực quản trị viên thành công! Đang chuyển hướng...");
        setTimeout(() => {
          window.location.href = "/?bypass=" + encodeURIComponent(bypassToken.trim());
        }, 1000);
      } else {
        toast.error("Mã bảo mật không chính xác!");
      }
    } catch {
      toast.error("Đã có lỗi xảy ra khi xác thực!");
    } finally {
      setIsSubmittingToken(false);
    }
  };

  return (
    <div className="min-h-screen bg-cinema-bg text-cinema-text flex flex-col items-center justify-between p-4 sm:p-6 relative overflow-hidden select-none">
      {/* Dynamic Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-brand-green/15 via-emerald-600/10 to-transparent rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-brand-green/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Header / Brand */}
      <header className="w-full max-w-5xl flex items-center justify-between py-4 z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-green to-emerald-700 flex items-center justify-center text-black font-black text-xl shadow-[0_0_20px_rgba(34,197,94,0.4)]">
            H
          </div>
          <span className="font-extrabold text-xl tracking-tight text-white">
            Hi <span className="text-brand-green">PHIM</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 border border-amber-500/30 text-amber-400 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            ĐANG BẢO TRÌ HỆ THỐNG
          </span>
        </div>
      </header>

      {/* Main Content Stage */}
      <main className="w-full max-w-2xl my-auto text-center z-10 flex flex-col items-center py-8">
        {/* Animated Icon Badge */}
        <div className="relative mb-6">
          <div className="absolute -inset-4 bg-brand-green/20 rounded-full blur-xl animate-pulse" />
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-[#111] border border-white/15 flex items-center justify-center shadow-2xl">
            <Wrench className="w-10 h-10 sm:w-12 sm:h-12 text-brand-green animate-bounce duration-1000" />
          </div>
        </div>

        <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight mb-3 leading-tight">
          Hệ Thống Đang Nâng Cấp & Bảo Trì
        </h1>
        <p className="text-white/60 text-sm sm:text-base max-w-lg mb-8 leading-relaxed">
          Hi Phim đang tiến hành tối ưu hóa cụm máy chủ và đồng bộ kho phim mới nhất. Chúng tôi sẽ sớm quay trở lại với tốc độ tải và chất lượng xem phim hoàn hảo hơn!
        </p>

        {/* Countdown Box */}
        <div className="w-full max-w-md bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-8 backdrop-blur-md shadow-2xl">
          <div className="flex items-center justify-center gap-2 text-xs font-bold text-white/50 uppercase tracking-wider mb-4">
            <Clock className="w-4 h-4 text-brand-green" />
            Thời gian dự kiến hoàn tất
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col items-center p-3 rounded-xl bg-black/40 border border-white/5">
              <span className="text-3xl sm:text-4xl font-black text-white tabular-nums">
                {String(timeLeft.hours).padStart(2, "0")}
              </span>
              <span className="text-[11px] font-semibold text-white/40 mt-1">Giờ</span>
            </div>
            <div className="flex flex-col items-center p-3 rounded-xl bg-black/40 border border-white/5">
              <span className="text-3xl sm:text-4xl font-black text-brand-green tabular-nums">
                {String(timeLeft.minutes).padStart(2, "0")}
              </span>
              <span className="text-[11px] font-semibold text-white/40 mt-1">Phút</span>
            </div>
            <div className="flex flex-col items-center p-3 rounded-xl bg-black/40 border border-white/5">
              <span className="text-3xl sm:text-4xl font-black text-white tabular-nums">
                {String(timeLeft.seconds).padStart(2, "0")}
              </span>
              <span className="text-[11px] font-semibold text-white/40 mt-1">Giây</span>
            </div>
          </div>
        </div>

        {/* Upgrade Highlights */}
        <div className="w-full max-w-md grid grid-cols-1 gap-2.5 mb-8 text-left">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5 text-xs text-white/70">
            <CheckCircle2 className="w-4 h-4 text-brand-green shrink-0" />
            <span>Nâng cấp hệ thống băng thông máy chủ phát video HLS</span>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5 text-xs text-white/70">
            <CheckCircle2 className="w-4 h-4 text-brand-green shrink-0" />
            <span>Tự động đồng bộ và nạp phim bộ, phim lẻ mới nhất 2026</span>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5 text-xs text-white/70">
            <CheckCircle2 className="w-4 h-4 text-brand-green shrink-0" />
            <span>Tối ưu hóa bộ nhớ đệm chống giật lag và reflow layout</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 flex-wrap justify-center">
          <button
            onClick={handleCheckStatus}
            disabled={isChecking}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-extrabold text-sm bg-brand-green hover:bg-brand-green-hover text-black transition-all shadow-[0_0_25px_rgba(34,197,94,0.3)] active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isChecking ? "animate-spin" : ""}`} />
            <span>{isChecking ? "Đang kiểm tra..." : "Kiểm tra kết nối lại"}</span>
          </button>

          <button
            onClick={() => setShowAdminBypass(!showAdminBypass)}
            className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/10 transition-all cursor-pointer"
          >
            <Key className="w-4 h-4" />
            <span>Quản trị viên</span>
          </button>
        </div>

        {/* Admin Bypass Drawer Form */}
        {showAdminBypass && (
          <form
            onSubmit={handleAdminBypassSubmit}
            className="mt-6 w-full max-w-sm p-4 rounded-2xl bg-[#141414] border border-white/15 text-left animate-in fade-in zoom-in duration-200"
          >
            <label className="block text-xs font-bold text-white/70 mb-2">
              Nhập mã Secret Token để truy cập kiểm thử:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="password"
                value={bypassToken}
                onChange={(e) => setBypassToken(e.target.value)}
                placeholder="Nhập mã token bảo mật..."
                className="flex-1 bg-black/60 border border-white/20 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-brand-green transition-colors"
              />
              <button
                type="submit"
                disabled={isSubmittingToken}
                className="px-4 py-2.5 rounded-xl bg-brand-green hover:bg-brand-green-hover text-black font-bold text-xs flex items-center gap-1 transition-all disabled:opacity-50 cursor-pointer"
              >
                <span>Vào</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full text-center py-4 z-10 border-t border-white/5">
        <p className="text-xs text-white/40">
          Hi Phim — Cảm ơn bạn đã kiên nhẫn đồng hành cùng chúng tôi.
        </p>
      </footer>
    </div>
  );
}
