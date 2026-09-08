"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Film,
  Megaphone,
  Wrench,
  Database,
  Settings,
  Shield,
  LogOut,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Save,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Sparkles,
  Play,
  Eye,
  Lock,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import type { SiteConfig } from "@/lib/site-config";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    "overview" | "featured" | "announcement" | "maintenance" | "cache" | "settings" | "security"
  >("overview");

  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [newSlug, setNewSlug] = useState("");

  // Cache update test state
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<any>(null);

  // API Health state
  const [apiPing, setApiPing] = useState<number | null>(null);
  const [isCheckingPing, setIsCheckingPing] = useState(false);

  // Change Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Load config on mount
  useEffect(() => {
    fetchConfig();
    checkApiHealth();
  }, []);

  const fetchConfig = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/config");
      if (res.status === 401) {
        router.push("/admin/login");
        return;
      }
      const data = await res.json();
      if (data.success) {
        setConfig(data.config);
      }
    } catch {
      toast.error("Không thể tải cấu hình website!");
    } finally {
      setIsLoading(false);
    }
  };

  const checkApiHealth = async () => {
    setIsCheckingPing(true);
    const start = Date.now();
    try {
      const res = await fetch("https://phimapi.com/danh-sach/phim-moi-cap-nhat-v2?page=1&limit=1", {
        cache: "no-store",
      });
      if (res.ok) {
        setApiPing(Date.now() - start);
      } else {
        setApiPing(-1);
      }
    } catch {
      setApiPing(-1);
    } finally {
      setIsCheckingPing(false);
    }
  };

  const handleSaveConfig = async (overrideConfig?: Partial<SiteConfig>) => {
    if (!config) return;
    setIsSaving(true);
    const dataToSave = overrideConfig ? { ...config, ...overrideConfig } : config;

    try {
      const res = await fetch("/api/admin/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSave),
      });

      const data = await res.json();
      if (data.success) {
        setConfig(data.config);
        toast.success("Đã lưu cấu hình thành công! Website đã được cập nhật tức thì.");
      } else {
        toast.error(data.error || "Lỗi khi lưu cấu hình!");
      }
    } catch {
      toast.error("Không thể kết nối đến máy chủ lưu cấu hình!");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
      toast.success("Đã đăng xuất thành công!");
      router.push("/admin/login");
      router.refresh();
    } catch {
      router.push("/admin/login");
    }
  };

  // Featured Movies management
  const handleAddSlug = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSlug.trim() || !config) return;
    const clean = newSlug.trim().toLowerCase().replace(/\s+/g, "-");
    if (config.featuredSlugs.includes(clean)) {
      toast.error("Phim này đã có trong danh sách ghim!");
      return;
    }
    const updated = { ...config, featuredSlugs: [clean, ...config.featuredSlugs] };
    setConfig(updated);
    setNewSlug("");
    handleSaveConfig(updated);
  };

  const handleRemoveSlug = (slugToRemove: string) => {
    if (!config) return;
    const updated = {
      ...config,
      featuredSlugs: config.featuredSlugs.filter((s) => s !== slugToRemove),
    };
    setConfig(updated);
    handleSaveConfig(updated);
  };

  const handleMoveSlug = (index: number, direction: "up" | "down") => {
    if (!config) return;
    const items = [...config.featuredSlugs];
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= items.length) return;

    const temp = items[index];
    items[index] = items[targetIdx];
    items[targetIdx] = temp;

    const updated = { ...config, featuredSlugs: items };
    setConfig(updated);
    handleSaveConfig(updated);
  };

  // Cache & Cron Auto-Update Trigger
  const handleTriggerSync = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch("/api/cron/auto-update?token=hiphim_secret_2026");
      const data = await res.json();
      if (data.success) {
        setSyncResult(data);
        toast.success("Đã làm mới toàn bộ bộ nhớ đệm trang web thành công!");
      } else {
        toast.error("Lỗi cập nhật dữ liệu: " + data.error);
      }
    } catch {
      toast.error("Không thể kích hoạt làm mới bộ nhớ đệm!");
    } finally {
      setIsSyncing(false);
    }
  };

  // Change Password Submit
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      toast.error("Vui lòng nhập mật khẩu hiện tại và mật khẩu mới!");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Xác nhận mật khẩu mới không trùng khớp!");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Mật khẩu mới phải có ít nhất 6 ký tự!");
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await fetch("/api/admin/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Đổi mật khẩu thành công!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast.error(data.error || "Mật khẩu hiện tại không chính xác!");
      }
    } catch {
      toast.error("Lỗi khi đổi mật khẩu!");
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (isLoading || !config) {
    return (
      <div className="min-h-screen bg-[#070707] flex flex-col items-center justify-center text-white gap-3">
        <RefreshCw className="w-8 h-8 text-brand-green animate-spin" />
        <p className="text-xs font-bold text-white/60">Đang tải trung tâm điều khiển...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070707] text-cinema-text flex flex-col select-none">
      {/* Top Navbar */}
      <header className="h-16 border-b border-white/10 bg-[#0d0d0d]/80 backdrop-blur-xl sticky top-0 z-50 flex items-center justify-between px-4 sm:px-8">
        <div className="flex items-center gap-3">
          <Link href="/" target="_blank" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-green to-emerald-700 flex items-center justify-center text-black font-black text-lg shadow-[0_0_15px_rgba(34,197,94,0.4)]">
              H
            </div>
            <span className="font-black text-lg tracking-tight text-white">
              Hi <span className="text-brand-green">Phim</span>
            </span>
          </Link>
          <span className="text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-0.5 rounded-full bg-brand-green/20 text-brand-green border border-brand-green/30">
            Admin Panel
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* View Website */}
          <Link
            href="/"
            target="_blank"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/10 transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Xem Website</span>
            <ExternalLink className="w-3 h-3 text-white/40 ml-0.5" />
          </Link>

          {/* Save Button */}
          <button
            onClick={() => handleSaveConfig()}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-black bg-brand-green hover:bg-brand-green-hover text-black shadow-[0_0_20px_rgba(34,197,94,0.3)] transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? "Đang lưu..." : "Lưu thay đổi"}</span>
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="p-2 rounded-xl text-white/50 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
            title="Đăng xuất"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Layout Container */}
      <div className="flex-1 flex flex-col md:flex-row max-w-[1600px] w-full mx-auto p-4 sm:p-6 lg:p-8 gap-6">
        {/* Navigation Sidebar */}
        <aside className="w-full md:w-64 shrink-0 flex md:flex-col gap-1 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
          <button
            onClick={() => setActiveTab("overview")}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeTab === "overview"
                ? "bg-brand-green/20 text-brand-green border border-brand-green/40 shadow-[inset_0_1px_0_rgba(34,197,94,0.2)]"
                : "text-white/60 hover:text-white hover:bg-white/5"
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Tổng quan</span>
          </button>

          <button
            onClick={() => setActiveTab("featured")}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeTab === "featured"
                ? "bg-brand-green/20 text-brand-green border border-brand-green/40 shadow-[inset_0_1px_0_rgba(34,197,94,0.2)]"
                : "text-white/60 hover:text-white hover:bg-white/5"
            }`}
          >
            <Film className="w-4 h-4" />
            <span>Ghim Phim ({config.featuredSlugs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("announcement")}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeTab === "announcement"
                ? "bg-brand-green/20 text-brand-green border border-brand-green/40 shadow-[inset_0_1px_0_rgba(34,197,94,0.2)]"
                : "text-white/60 hover:text-white hover:bg-white/5"
            }`}
          >
            <Megaphone className="w-4 h-4" />
            <span>Banner Thông Báo</span>
            {config.announcement.enabled && (
              <span className="w-2 h-2 rounded-full bg-brand-green ml-auto" />
            )}
          </button>

          <button
            onClick={() => setActiveTab("maintenance")}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeTab === "maintenance"
                ? "bg-brand-green/20 text-brand-green border border-brand-green/40 shadow-[inset_0_1px_0_rgba(34,197,94,0.2)]"
                : "text-white/60 hover:text-white hover:bg-white/5"
            }`}
          >
            <Wrench className="w-4 h-4" />
            <span>Chế độ Bảo Trì</span>
            {config.maintenance.enabled && (
              <span className="w-2 h-2 rounded-full bg-amber-400 ml-auto animate-pulse" />
            )}
          </button>

          <button
            onClick={() => setActiveTab("cache")}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeTab === "cache"
                ? "bg-brand-green/20 text-brand-green border border-brand-green/40 shadow-[inset_0_1px_0_rgba(34,197,94,0.2)]"
                : "text-white/60 hover:text-white hover:bg-white/5"
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Cache & Cron Sync</span>
          </button>

          <button
            onClick={() => setActiveTab("settings")}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeTab === "settings"
                ? "bg-brand-green/20 text-brand-green border border-brand-green/40 shadow-[inset_0_1px_0_rgba(34,197,94,0.2)]"
                : "text-white/60 hover:text-white hover:bg-white/5"
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Cấu hình SEO & Chung</span>
          </button>

          <button
            onClick={() => setActiveTab("security")}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeTab === "security"
                ? "bg-brand-green/20 text-brand-green border border-brand-green/40 shadow-[inset_0_1px_0_rgba(34,197,94,0.2)]"
                : "text-white/60 hover:text-white hover:bg-white/5"
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Bảo mật & Đổi Mật Khẩu</span>
          </button>
        </aside>

        {/* Tab Content Stage */}
        <main className="flex-1 min-w-0 bg-[#101010]/80 border border-white/10 rounded-3xl p-5 sm:p-7 backdrop-blur-2xl shadow-2xl">
          
          {/* ======================================================== */}
          {/* TAB 1: TỔNG QUAN (OVERVIEW) */}
          {/* ======================================================== */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-extrabold text-white">Tổng Quan Hệ Thống</h2>
                <p className="text-xs text-white/50">Trạng thái vận hành và các chỉ số sức khỏe của website.</p>
              </div>

              {/* Status Metric Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Maintenance Card */}
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-xs font-bold text-white/60 mb-3">
                    <span>Chế độ Bảo Trì</span>
                    <Wrench className="w-4 h-4 text-brand-green" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${config.maintenance.enabled ? "bg-amber-400 animate-pulse" : "bg-brand-green"}`} />
                    <span className="text-base font-black text-white">
                      {config.maintenance.enabled ? "Đang Bật" : "Hoạt Động Bình Thường"}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      const updated = {
                        ...config,
                        maintenance: { ...config.maintenance, enabled: !config.maintenance.enabled },
                      };
                      setConfig(updated);
                      handleSaveConfig(updated);
                    }}
                    className="mt-4 text-[11px] font-bold text-brand-green hover:underline text-left cursor-pointer"
                  >
                    {config.maintenance.enabled ? "Tắt ngay →" : "Bật bảo trì →"}
                  </button>
                </div>

                {/* Announcement Card */}
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-xs font-bold text-white/60 mb-3">
                    <span>Banner Thông Báo</span>
                    <Megaphone className="w-4 h-4 text-brand-green" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${config.announcement.enabled ? "bg-brand-green" : "bg-white/30"}`} />
                    <span className="text-base font-black text-white">
                      {config.announcement.enabled ? "Đang Hiển Thị" : "Đang Tắt"}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      const updated = {
                        ...config,
                        announcement: { ...config.announcement, enabled: !config.announcement.enabled },
                      };
                      setConfig(updated);
                      handleSaveConfig(updated);
                    }}
                    className="mt-4 text-[11px] font-bold text-brand-green hover:underline text-left cursor-pointer"
                  >
                    {config.announcement.enabled ? "Tắt banner →" : "Bật banner →"}
                  </button>
                </div>

                {/* Featured Movies Count */}
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-xs font-bold text-white/60 mb-3">
                    <span>Phim Ghim Trang Chủ</span>
                    <Film className="w-4 h-4 text-brand-green" />
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-black text-white">{config.featuredSlugs.length}</span>
                    <span className="text-xs text-white/50">phim đang ghim</span>
                  </div>
                  <button
                    onClick={() => setActiveTab("featured")}
                    className="mt-4 text-[11px] font-bold text-brand-green hover:underline text-left cursor-pointer"
                  >
                    Quản lý danh sách →
                  </button>
                </div>

                {/* Upstream API Health */}
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-xs font-bold text-white/60 mb-3">
                    <span>Máy Chủ Nguồn Phim</span>
                    <button onClick={checkApiHealth} className="hover:text-white" title="Kiểm tra lại">
                      <RefreshCw className={`w-3.5 h-3.5 ${isCheckingPing ? "animate-spin" : ""}`} />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        apiPing !== null && apiPing > 0 && apiPing < 1000
                          ? "bg-brand-green"
                          : apiPing === -1
                          ? "bg-red-500"
                          : "bg-amber-400"
                      }`}
                    />
                    <span className="text-base font-black text-white">
                      {apiPing === null
                        ? "Đang kiểm tra..."
                        : apiPing === -1
                        ? "Mất kết nối"
                        : `${apiPing}ms (Ổn định)`}
                    </span>
                  </div>
                  <span className="mt-4 text-[11px] text-white/40 block truncate">
                    Nguồn: phimapi.com
                  </span>
                </div>
              </div>

              {/* Quick Actions Panel */}
              <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
                <h3 className="text-xs font-extrabold text-white/70 uppercase tracking-wider">Thao tác nhanh</h3>
                <div className="flex items-center gap-3 flex-wrap">
                  <button
                    onClick={handleTriggerSync}
                    disabled={isSyncing}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-green/15 hover:bg-brand-green/25 text-brand-green border border-brand-green/30 text-xs font-bold transition-all cursor-pointer"
                  >
                    <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`} />
                    <span>Làm mới Cache & Đồng bộ Phim Ngay</span>
                  </button>

                  <Link
                    href="/maintenance"
                    target="_blank"
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 text-xs font-bold transition-all"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Xem Thử Giao Diện Trang Bảo Trì</span>
                  </Link>

                  <Link
                    href="/?bypass=hiphim_secret_2026"
                    target="_blank"
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 text-xs font-bold transition-all"
                  >
                    <Shield className="w-4 h-4" />
                    <span>Link Duyệt Web Vượt Rào (Bypass)</span>
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: GHIM PHIM NỔI BẬT (FEATURED MOVIES) */}
          {/* ======================================================== */}
          {activeTab === "featured" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-extrabold text-white">Quản Lý Ghim Phim Nổi Bật</h2>
                <p className="text-xs text-white/50">
                  Các bộ phim này sẽ xuất hiện trên thanh trượt Banner Hero đầu trang chủ. Thứ tự từ trên xuống dưới tương ứng với vị trí hiển thị từ trái qua phải.
                </p>
              </div>

              {/* Add New Movie Slug Form */}
              <form onSubmit={handleAddSlug} className="flex gap-2">
                <input
                  type="text"
                  value={newSlug}
                  onChange={(e) => setNewSlug(e.target.value)}
                  placeholder="Nhập slug phim (ví dụ: deadpool-va-wolverine hoặc doremon-2026)..."
                  className="flex-1 bg-black/60 border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-brand-green"
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-brand-green hover:bg-brand-green-hover text-black font-extrabold text-xs flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(34,197,94,0.3)] cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Ghim Phim</span>
                </button>
              </form>

              {/* Pinned Slugs List */}
              <div className="space-y-2">
                {config.featuredSlugs.map((slug, idx) => (
                  <div
                    key={slug}
                    className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition-all group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-6 h-6 rounded-lg bg-black/40 border border-white/10 text-[11px] font-black text-brand-green flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span className="font-mono text-xs text-white truncate font-bold">{slug}</span>
                      <Link
                        href={`/phim/${slug}`}
                        target="_blank"
                        className="text-white/30 hover:text-brand-green transition-colors"
                        title="Xem trang phim"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleMoveSlug(idx, "up")}
                        disabled={idx === 0}
                        className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 disabled:opacity-20 cursor-pointer"
                        title="Lên trên"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleMoveSlug(idx, "down")}
                        disabled={idx === config.featuredSlugs.length - 1}
                        className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 disabled:opacity-20 cursor-pointer"
                        title="Xuống dưới"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleRemoveSlug(slug)}
                        className="p-1.5 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors ml-1 cursor-pointer"
                        title="Bỏ ghim"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 3: BANNER THÔNG BÁO (ANNOUNCEMENT BANNER) */}
          {/* ======================================================== */}
          {activeTab === "announcement" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-extrabold text-white">Banner Thông Báo Toàn Trang</h2>
                <p className="text-xs text-white/50">
                  Hiển thị thanh thông báo nổi bật xuất hiện trên đầu website để thông báo tin tức quan trọng tới khán giả.
                </p>
              </div>

              {/* Enable / Disable Toggle */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/10">
                <div className="space-y-0.5">
                  <span className="text-sm font-bold text-white block">Kích hoạt Banner</span>
                  <span className="text-xs text-white/40 block">Bật hoặc tắt thanh thông báo trên toàn bộ trang web</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.announcement.enabled}
                    onChange={(e) => {
                      const updated = {
                        ...config,
                        announcement: { ...config.announcement, enabled: e.target.checked },
                      };
                      setConfig(updated);
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-green" />
                </label>
              </div>

              {/* Banner Type */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-white/80 block">Phong cách thông báo</label>
                <div className="grid grid-cols-3 gap-3">
                  {(["info", "warning", "success"] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() =>
                        setConfig({
                          ...config,
                          announcement: { ...config.announcement, type },
                        })
                      }
                      className={`p-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        config.announcement.type === type
                          ? "bg-white/15 border-brand-green text-white"
                          : "bg-white/[0.02] border-white/10 text-white/50 hover:text-white"
                      }`}
                    >
                      {type === "info" && "Thông tin (Xanh dương)"}
                      {type === "warning" && "Cảnh báo (Vàng hổ phách)"}
                      {type === "success" && "Nổi bật (Xanh lá điện ảnh)"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Banner Text */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-white/80 block">Nội dung thông báo</label>
                <textarea
                  rows={3}
                  value={config.announcement.text}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      announcement: { ...config.announcement, text: e.target.value },
                    })
                  }
                  placeholder="Nhập thông báo gửi đến người dùng..."
                  className="w-full bg-black/60 border border-white/15 rounded-xl p-3.5 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-brand-green"
                />
              </div>

              {/* Banner Link */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-white/80 block">Liên kết đính kèm (Tùy chọn)</label>
                <input
                  type="text"
                  value={config.announcement.link || ""}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      announcement: { ...config.announcement, link: e.target.value },
                    })
                  }
                  placeholder="https://t.me/... hoặc /phim/deadpool"
                  className="w-full bg-black/60 border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-brand-green"
                />
              </div>

              {/* Live Preview Box */}
              <div className="space-y-2 pt-2">
                <label className="text-xs font-bold text-white/50 uppercase tracking-wider block">Xem trước hiển thị thực tế</label>
                <div
                  className={`p-3 rounded-xl border flex items-center justify-between text-xs font-semibold ${
                    config.announcement.type === "warning"
                      ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                      : config.announcement.type === "success"
                      ? "bg-brand-green/10 border-brand-green/30 text-brand-green"
                      : "bg-blue-500/10 border-blue-500/30 text-blue-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Megaphone className="w-4 h-4 shrink-0" />
                    <span>{config.announcement.text || "Chưa có nội dung thông báo"}</span>
                  </div>
                  {config.announcement.link && (
                    <span className="text-[10px] underline ml-2 shrink-0">Xem chi tiết →</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 4: CHẾ ĐỘ BẢO TRÌ (MAINTENANCE CONTROL) */}
          {/* ======================================================== */}
          {activeTab === "maintenance" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-extrabold text-white">Quản Lý Chế Độ Bảo Trì</h2>
                <p className="text-xs text-white/50">
                  Khi kích hoạt, toàn bộ người dùng sẽ được chuyển hướng sang trang bảo trì chuyên nghiệp với mã HTTP 503 (chuẩn SEO an toàn).
                </p>
              </div>

              {/* Maintenance Toggle Card */}
              <div className="flex items-center justify-between p-5 rounded-2xl bg-white/[0.02] border border-white/10">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-extrabold text-white">Chế độ Bảo Trì Hệ Thống</span>
                    {config.maintenance.enabled && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-pulse">
                        ĐANG KÍCH HOẠT
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-white/50">
                    Bật để khóa truy cập tạm thời khi cập nhật máy chủ. Quản trị viên vẫn truy cập được bình thường qua mã Bypass.
                  </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.maintenance.enabled}
                    onChange={(e) => {
                      const updated = {
                        ...config,
                        maintenance: { ...config.maintenance, enabled: e.target.checked },
                      };
                      setConfig(updated);
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-12 h-6 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500" />
                </label>
              </div>

              {/* Maintenance Reason */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-white/80 block">Thông điệp bảo trì hiển thị với khán giả</label>
                <textarea
                  rows={3}
                  value={config.maintenance.reason}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      maintenance: { ...config.maintenance, reason: e.target.value },
                    })
                  }
                  placeholder="Hệ thống đang được nâng cấp định kỳ..."
                  className="w-full bg-black/60 border border-white/15 rounded-xl p-3.5 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-brand-green"
                />
              </div>

              {/* Quick Links */}
              <div className="pt-2 border-t border-white/10 flex items-center gap-3">
                <Link
                  href="/maintenance"
                  target="_blank"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-green hover:underline"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Xem trực tiếp giao diện trang /maintenance</span>
                </Link>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 5: CACHE & CRON SYNC */}
          {/* ======================================================== */}
          {activeTab === "cache" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-extrabold text-white">Quản Lý Bộ Nhớ Đệm & Cập Nhật Tự Động</h2>
                <p className="text-xs text-white/50">
                  Làm mới bộ nhớ đệm tĩnh Next.js ISR và mồi dữ liệu phim mới nhất vào RAM.
                </p>
              </div>

              {/* Sync Trigger Card */}
              <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="space-y-1">
                    <h3 className="text-sm font-extrabold text-white">Kích Hoạt Làm Mới Cache Tức Thì</h3>
                    <p className="text-xs text-white/50">
                      Hệ thống sẽ làm mới cache của Trang chủ, Trang Phim mới và danh mục, đồng thời nạp trước phim mới từ nguồn.
                    </p>
                  </div>

                  <button
                    onClick={handleTriggerSync}
                    disabled={isSyncing}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-green hover:bg-brand-green-hover text-black font-black text-xs shadow-[0_0_20px_rgba(34,197,94,0.3)] transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`} />
                    <span>{isSyncing ? "Đang đồng bộ..." : "Xóa & Làm Mới Cache Ngay"}</span>
                  </button>
                </div>

                {/* Sync Result Output */}
                {syncResult && (
                  <div className="p-4 rounded-xl bg-black/60 border border-white/10 text-xs font-mono space-y-2 animate-in fade-in">
                    <div className="flex items-center gap-2 text-brand-green font-bold">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{syncResult.message}</span>
                    </div>
                    <p className="text-white/60">Thời gian thực thi: {syncResult.executionTimeMs}ms</p>
                    <p className="text-white/60">Số phim mới tìm thấy: {syncResult.freshMoviesFound}</p>
                    <p className="text-white/60">Các trang đã revalidate: {syncResult.revalidatedPaths?.join(", ")}</p>
                  </div>
                )}
              </div>

              {/* Cron Schedule Guide */}
              <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
                <div className="flex items-center gap-2 text-xs font-extrabold text-white/70">
                  <Clock className="w-4 h-4 text-brand-green" />
                  <span>Lịch trình tự động qua Vercel Cron</span>
                </div>
                <p className="text-xs text-white/50 leading-relaxed">
                  Hệ thống đã cấu hình sẵn tệp <code className="text-brand-green">vercel.json</code> tự động kích hoạt mỗi 15 phút một lần để luôn bảo đảm website của bạn luôn cập nhật tập phim mới nhất mà không cần thao tác thủ công.
                </p>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 6: CẤU HÌNH SEO & CHUNG (GENERAL SETTINGS) */}
          {/* ======================================================== */}
          {activeTab === "settings" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-extrabold text-white">Cấu Hình Chung & SEO</h2>
                <p className="text-xs text-white/50">Cài đặt thông tin thương hiệu, mạng xã hội và trình phát video.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Site Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-white/80 block">Tên website</label>
                  <input
                    type="text"
                    value={config.siteName}
                    onChange={(e) => setConfig({ ...config, siteName: e.target.value })}
                    className="w-full bg-black/60 border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-green"
                  />
                </div>

                {/* Telegram Contact */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-white/80 block">Kênh Telegram hỗ trợ</label>
                  <input
                    type="text"
                    value={config.contactTelegram || ""}
                    onChange={(e) => setConfig({ ...config, contactTelegram: e.target.value })}
                    placeholder="https://t.me/..."
                    className="w-full bg-black/60 border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-green"
                  />
                </div>
              </div>

              {/* Site Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-white/80 block">Mô tả SEO (Meta Description)</label>
                <textarea
                  rows={2}
                  value={config.siteDescription}
                  onChange={(e) => setConfig({ ...config, siteDescription: e.target.value })}
                  className="w-full bg-black/60 border border-white/15 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-brand-green"
                />
              </div>

              {/* Footer Text */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-white/80 block">Dòng chữ chân trang (Footer Text)</label>
                <input
                  type="text"
                  value={config.customFooterText || ""}
                  onChange={(e) => setConfig({ ...config, customFooterText: e.target.value })}
                  className="w-full bg-black/60 border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-green"
                />
              </div>

              {/* Video Player Settings */}
              <div className="pt-4 border-t border-white/10 space-y-4">
                <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <Play className="w-4 h-4 text-brand-green" />
                  <span>Cài đặt Trình Phát Video Mặc Định</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-white/80 block">Chế độ phát mặc định</label>
                    <select
                      value={config.player.defaultMode}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          player: { ...config.player, defaultMode: e.target.value as "m3u8" | "embed" },
                        })
                      }
                      className="w-full bg-black/60 border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-green"
                    >
                      <option value="m3u8">Trình phát HLS M3U8 (Tùy biến cao cấp, 60fps)</option>
                      <option value="embed">Trình phát Embed (Nhúng trực tiếp từ server)</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/10">
                    <span className="text-xs font-bold text-white">Tự động phát khi tải trang</span>
                    <input
                      type="checkbox"
                      checked={config.player.autoplay}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          player: { ...config.player, autoplay: e.target.checked },
                        })
                      }
                      className="w-4 h-4 accent-brand-green cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 7: BẢO MẬT & ĐỔI MẬT KHẨU (SECURITY) */}
          {/* ======================================================== */}
          {activeTab === "security" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-extrabold text-white">Bảo Mật Tài Khoản Quản Trị</h2>
                <p className="text-xs text-white/50">Thay đổi mật khẩu đăng nhập của tài khoản admin.</p>
              </div>

              <form onSubmit={handleChangePassword} className="max-w-md space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-white/80 block">Mật khẩu hiện tại</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Nhập mật khẩu cũ..."
                    required
                    className="w-full bg-black/60 border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-green"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-white/80 block">Mật khẩu mới</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Nhập mật khẩu mới (ít nhất 6 ký tự)..."
                    required
                    className="w-full bg-black/60 border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-green"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-white/80 block">Xác nhận mật khẩu mới</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Nhập lại mật khẩu mới..."
                    required
                    className="w-full bg-black/60 border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-green"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="px-6 py-3 rounded-xl bg-brand-green hover:bg-brand-green-hover text-black font-black text-xs flex items-center gap-2 shadow-[0_0_20px_rgba(34,197,94,0.3)] transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <Lock className="w-4 h-4" />
                  <span>{isChangingPassword ? "Đang xử lý..." : "Cập Nhật Mật Khẩu"}</span>
                </button>
              </form>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
