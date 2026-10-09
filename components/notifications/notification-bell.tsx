"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  Bell,
  CheckCircle2,
  Clock,
  ExternalLink,
  Check,
  Loader2,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  X,
  User,
  Shield,
} from "lucide-react";
import { useUserAuth } from "@/context/user-auth-context";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export interface MovieReportItem {
  id: string;
  movieSlug: string;
  movieName: string;
  episodeName?: string;
  serverName?: string;
  issueType: string;
  description?: string;
  status: "pending" | "resolved";
  createdAt: number;
  userId?: string;
  userEmail?: string;
  userName?: string;
  resolvedAt?: number;
}

function formatRelativeTime(timestamp: number) {
  if (!timestamp) return "";
  const diffSec = Math.floor((Date.now() - timestamp) / 1000);
  if (diffSec < 60) return "Vừa xong";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} phút trước`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} giờ trước`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 30) return `${diffDay} ngày trước`;
  return new Date(timestamp).toLocaleDateString("vi-VN");
}

export default function NotificationBell({ className }: { className?: string }) {
  const { user, openAuthModal } = useUserAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [reports, setReports] = useState<MovieReportItem[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [adminTab, setAdminTab] = useState<"pending" | "all">("pending");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  const isSuperAdmin = Boolean(
    user &&
      (user.role === "admin" ||
        user.role === "superadmin" ||
        user.email?.toLowerCase() === "kimdinhphuong205@gmail.com")
  );

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch reports based on role (Admin gets all reports; regular user gets their own)
  const fetchReports = useCallback(async (isSilent = false) => {
    if (!user) {
      setReports([]);
      setPendingCount(0);
      return;
    }

    if (!isSilent) setIsLoading(true);
    try {
      const res = await fetch("/api/report", { method: "GET" });
      if (!res.ok) {
        if (!isSilent) setIsLoading(false);
        return;
      }

      const data = await res.json();
      if (data.success && Array.isArray(data.reports)) {
        setReports(data.reports);
        if (data.isAdmin) {
          setPendingCount(
            typeof data.pendingCount === "number"
              ? data.pendingCount
              : data.reports.filter((r: MovieReportItem) => r.status === "pending").length
          );
        } else {
          // For regular user: count reports that are resolved recently or pending
          const resolvedCount = data.reports.filter((r: MovieReportItem) => r.status === "resolved").length;
          setPendingCount(resolvedCount);
        }
      }
    } catch {
      // Ignore background fetch error
    } finally {
      if (!isSilent) setIsLoading(false);
    }
  }, [user]);

  // Initial fetch and 35s polling
  useEffect(() => {
    fetchReports(false);

    const interval = setInterval(() => {
      fetchReports(true);
    }, 35000);

    return () => clearInterval(interval);
  }, [fetchReports]);

  // Listen for local events across components
  useEffect(() => {
    const handleReportCreated = (e: any) => {
      const newReport: MovieReportItem = e.detail;
      if (!newReport) return;

      setReports((prev) => [newReport, ...prev.filter((r) => r.id !== newReport.id)]);

      if (isSuperAdmin) {
        setPendingCount((c) => c + 1);
        toast.info("🔔 Báo lỗi tập mới vừa được gửi", {
          description: `${newReport.movieName} ${newReport.episodeName ? `(${newReport.episodeName})` : ""}`,
        });
      }
    };

    const handleReportStatusChanged = (e: any) => {
      const { id, status } = e.detail || {};
      if (!id || !status) return;

      setReports((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status, resolvedAt: status === "resolved" ? Date.now() : undefined } : r))
      );

      if (isSuperAdmin) {
        setPendingCount((prev) => Math.max(0, status === "resolved" ? prev - 1 : prev + 1));
      }
    };

    window.addEventListener("report-created", handleReportCreated);
    window.addEventListener("report-status-changed", handleReportStatusChanged);

    return () => {
      window.removeEventListener("report-created", handleReportCreated);
      window.removeEventListener("report-status-changed", handleReportStatusChanged);
    };
  }, [isSuperAdmin]);

  // Admin: 1-click Mark as Resolved directly from popover
  const handleMarkResolved = async (reportId: string, currentStatus: "pending" | "resolved") => {
    const newStatus = currentStatus === "pending" ? "resolved" : "pending";
    try {
      setUpdatingId(reportId);
      const res = await fetch("/api/report", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: reportId, status: newStatus }),
      });

      const data = await res.json();
      if (data.success) {
        setReports((prev) =>
          prev.map((r) =>
            r.id === reportId
              ? { ...r, status: newStatus, resolvedAt: newStatus === "resolved" ? Date.now() : undefined }
              : r
          )
        );

        if (newStatus === "resolved") {
          setPendingCount((prev) => Math.max(0, prev - 1));
          toast.success("Đã đánh dấu tập phim này đã sửa xong!");
        } else {
          setPendingCount((prev) => prev + 1);
          toast.info("Đã chuyển lại sang chờ xử lý.");
        }

        window.dispatchEvent(
          new CustomEvent("report-status-changed", {
            detail: { id: reportId, status: newStatus },
          })
        );
      } else {
        toast.error(data.error || "Không thể cập nhật trạng thái.");
      }
    } catch {
      toast.error("Có lỗi xảy ra khi cập nhật.");
    } finally {
      setUpdatingId(null);
    }
  };

  const displayedReports = isSuperAdmin
    ? adminTab === "pending"
      ? reports.filter((r) => r.status === "pending")
      : reports
    : reports;

  const badgeCount = isSuperAdmin ? pendingCount : reports.filter((r) => r.status === "resolved").length;

  return (
    <div className={cn("relative shrink-0 pointer-events-auto", className)} ref={containerRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => {
          if (!user) {
            openAuthModal("login");
            return;
          }
          setIsOpen(!isOpen);
        }}
        className={cn(
          "relative flex items-center justify-center w-9 sm:w-10 h-9 sm:h-10 rounded-full bg-[#111714] border border-white/10 hover:border-brand-green/60 text-white/80 hover:text-white transition-all duration-300 group cursor-pointer active:scale-95 shadow-sm",
          isOpen && "border-brand-green bg-[#141e18] text-brand-green shadow-[0_0_15px_rgba(32,214,107,0.25)]"
        )}
        aria-label="Thông báo báo lỗi tập phim"
        title={isSuperAdmin ? "Thông báo báo lỗi tập (Admin)" : "Thông báo tập phim"}
      >
        <Bell
          className={cn(
            "w-4 h-4 transition-transform group-hover:scale-110",
            isOpen ? "text-brand-green" : "text-white/80 group-hover:text-brand-green"
          )}
        />

        {/* Counter Badge */}
        {badgeCount > 0 && (
          <span
            className={cn(
              "absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-black flex items-center justify-center text-white shadow-md animate-in zoom-in-50 duration-200",
              isSuperAdmin
                ? "bg-rose-500 border border-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.6)]"
                : "bg-brand-green border border-brand-green text-black shadow-[0_0_8px_rgba(32,214,107,0.5)]"
            )}
          >
            {badgeCount > 99 ? "99+" : badgeCount}
          </span>
        )}

        {/* Pulse attention dot */}
        {badgeCount > 0 && (
          <span
            className={cn(
              "absolute -top-1 -right-1 w-[18px] h-[18px] rounded-full animate-ping opacity-35 pointer-events-none",
              isSuperAdmin ? "bg-rose-500" : "bg-brand-green"
            )}
          />
        )}
      </button>

      {/* Popover Dropdown - Pure Solid Cinema Dark, No blurry brown bleed-through */}
      {isOpen && (
        <div
          className={cn(
            "absolute top-full mt-2 w-[340px] sm:w-[375px] max-w-[calc(100vw-20px)]",
            // Position: on mobile aligned to right edge; on desktop offset right to stay neatly under bell & user menu
            "right-0 lg:-right-36",
            "bg-[#0d1410] border border-emerald-500/25 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.95),0_0_35px_rgba(32,214,107,0.08)] z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-white flex flex-col select-none"
          )}
        >
          {/* Header */}
          <div className="p-3 sm:p-3.5 border-b border-white/8 bg-[#090e0b] flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-brand-green/15 border border-brand-green/30 text-brand-green flex items-center justify-center shrink-0">
                <Bell className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-xs sm:text-sm text-white truncate">
                    {isSuperAdmin ? "Báo Lỗi Tập Phim" : "Thông Báo Của Bạn"}
                  </h3>
                  {isSuperAdmin && (
                    <span className="text-[9.5px] px-1.5 py-0.2 rounded-full font-mono font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                      ADMIN
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-white/50 truncate">
                  {isSuperAdmin
                    ? `${pendingCount} tập đang chờ ban quản trị xử lý`
                    : "Tiến độ khắc phục các tập phim bạn đã báo"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => fetchReports(false)}
                disabled={isLoading}
                className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Làm mới danh sách"
              >
                <RefreshCw className={cn("w-3.5 h-3.5", isLoading && "animate-spin text-brand-green")} />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Đóng"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Admin Segmented Tabs (Clean Emerald vs Inactive Gray) */}
          {isSuperAdmin && (
            <div className="p-2 bg-[#090f0c] border-b border-white/5 shrink-0">
              <div className="flex items-center gap-1 bg-[#050806] p-1 rounded-xl border border-white/5">
                <button
                  type="button"
                  onClick={() => setAdminTab("pending")}
                  className={cn(
                    "flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                    adminTab === "pending"
                      ? "bg-brand-green text-black shadow-[0_0_12px_rgba(32,214,107,0.3)]"
                      : "text-white/60 hover:text-white hover:bg-white/5"
                  )}
                >
                  <span>Chờ xử lý</span>
                  <span
                    className={cn(
                      "text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold",
                      adminTab === "pending" ? "bg-black/25 text-black" : "bg-white/10 text-white/70"
                    )}
                  >
                    {pendingCount}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setAdminTab("all")}
                  className={cn(
                    "flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                    adminTab === "all"
                      ? "bg-brand-green text-black shadow-[0_0_12px_rgba(32,214,107,0.3)]"
                      : "text-white/60 hover:text-white hover:bg-white/5"
                  )}
                >
                  <span>Tất cả</span>
                  <span
                    className={cn(
                      "text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold",
                      adminTab === "all" ? "bg-black/25 text-black" : "bg-white/10 text-white/70"
                    )}
                  >
                    {reports.length}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Report List Body */}
          <div className="max-h-[380px] overflow-y-auto custom-scrollbar p-2 sm:p-2.5 space-y-2 bg-[#0d1410]">
            {isLoading && reports.length === 0 ? (
              <div className="p-8 text-center text-white/40 flex flex-col items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-brand-green" />
                <span className="text-xs">Đang tải thông báo...</span>
              </div>
            ) : displayedReports.length === 0 ? (
              <div className="p-8 text-center text-white/50 flex flex-col items-center justify-center gap-2">
                <CheckCircle2 className="w-8 h-8 text-brand-green/70 mb-1" />
                <p className="text-xs font-semibold text-white/90">
                  {isSuperAdmin
                    ? adminTab === "pending"
                      ? "Tuyệt vời! Không còn tập nào chờ sửa."
                      : "Chưa có báo cáo lỗi nào trong hệ thống."
                    : "Bạn chưa gửi báo lỗi tập phim nào."}
                </p>
                <p className="text-[11px] text-white/40 max-w-[260px] leading-relaxed">
                  {isSuperAdmin
                    ? "Hệ thống sẽ cập nhật tự động khi có thành viên gửi báo cáo lỗi tập mới."
                    : "Khi xem phim nếu phát hiện lỗi, hãy bấm nút 'Báo lỗi tập' để admin xử lý nhé."}
                </p>
              </div>
            ) : (
              displayedReports.map((report) => {
                const isPending = report.status === "pending";
                return (
                  <div
                    key={report.id}
                    className={cn(
                      "p-3 rounded-xl border transition-all duration-200 group relative space-y-2",
                      "bg-[#121915] hover:bg-[#16211c]",
                      isPending
                        ? "border-white/10 hover:border-brand-green/35"
                        : "border-white/5 opacity-80 hover:opacity-100"
                    )}
                  >
                    {/* Top Row: Status badge & timestamp */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={cn(
                            "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1",
                            isPending
                              ? "bg-amber-400/15 text-amber-300 border border-amber-400/25"
                              : "bg-brand-green/15 text-brand-green border border-brand-green/25"
                          )}
                        >
                          {isPending ? (
                            <>
                              <Clock className="w-2.5 h-2.5" />
                              Chờ xử lý
                            </>
                          ) : (
                            <>
                              <Check className="w-2.5 h-2.5" />
                              Đã sửa xong
                            </>
                          )}
                        </span>

                        {report.serverName && (
                          <span className="text-[10px] text-white/50 bg-white/5 px-1.5 py-0.5 rounded border border-white/5 font-mono">
                            {report.serverName}
                          </span>
                        )}
                      </div>

                      <span className="text-[10.5px] font-mono text-white/40">
                        {formatRelativeTime(report.createdAt)}
                      </span>
                    </div>

                    {/* Movie title & Episode */}
                    <div className="flex items-baseline gap-1.5">
                      <h4 className="text-xs sm:text-[13px] font-bold text-white group-hover:text-brand-green transition-colors line-clamp-1">
                        {report.movieName}
                      </h4>
                      {report.episodeName && (
                        <span className="text-[11px] font-extrabold text-brand-green shrink-0 bg-brand-green/10 border border-brand-green/25 px-1.5 py-0.2 rounded">
                          {report.episodeName}
                        </span>
                      )}
                    </div>

                    {/* Reporter info */}
                    {(report.userName || report.userEmail) && (
                      <div className="flex items-center gap-1.5 text-[11px] text-white/60">
                        <User className="w-3 h-3 text-brand-green shrink-0" />
                        <span className="font-medium text-white/80 truncate">
                          {report.userName || report.userEmail?.split("@")[0]}
                        </span>
                        {report.userEmail && (
                          <span className="text-white/40 font-mono truncate text-[10px]">
                            ({report.userEmail})
                          </span>
                        )}
                      </div>
                    )}

                    {/* Issue type & note box */}
                    <div className="p-2 rounded-lg bg-[#080d0a] border border-white/6 text-xs">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-400">
                        <AlertTriangle className="w-3 h-3 shrink-0" />
                        <span className="truncate">{report.issueType}</span>
                      </div>
                      {report.description && (
                        <p className="text-[11px] text-white/70 mt-1 line-clamp-2 italic leading-relaxed">
                          &ldquo;{report.description}&rdquo;
                        </p>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/5">
                      <Link
                        href={`/watch?slug=${encodeURIComponent(report.movieSlug)}`}
                        onClick={() => setIsOpen(false)}
                        className="py-1 px-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/10 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                        title="Mở xem tập phim"
                      >
                        <ExternalLink className="w-3 h-3 text-brand-green" />
                        <span>Xem tập</span>
                      </Link>

                      {/* Admin 1-Click Status Toggle */}
                      {isSuperAdmin && (
                        <button
                          type="button"
                          onClick={() => handleMarkResolved(report.id, report.status)}
                          disabled={updatingId === report.id}
                          className={cn(
                            "py-1 px-3 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95",
                            isPending
                              ? "bg-brand-green hover:bg-brand-green-hover text-black shadow-[0_0_12px_rgba(32,214,107,0.3)]"
                              : "bg-white/10 hover:bg-white/15 text-white/80 hover:text-white"
                          )}
                        >
                          {updatingId === report.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Check className="w-3 h-3" />
                          )}
                          <span>{isPending ? "Đã sửa" : "Mở lại"}</span>
                        </button>
                      )}

                      {!isSuperAdmin && !isPending && (
                        <span className="text-[11px] font-semibold text-brand-green flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Đã khắc phục
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Navigation */}
          {isSuperAdmin && (
            <div className="p-2.5 bg-[#090e0b] border-t border-white/8 shrink-0 flex items-center justify-between text-xs">
              <span className="text-[11px] text-white/40">Quản trị báo cáo tập</span>
              <Link
                href="/admin?tab=reports"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-1 text-xs font-bold text-brand-green hover:text-emerald-300 transition-colors group"
              >
                <span>Mở trang quản trị đầy đủ</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
