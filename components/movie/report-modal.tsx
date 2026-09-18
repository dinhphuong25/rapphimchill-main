"use client";

import { useState } from "react";
import { AlertTriangle, X, Check, Loader2, VolumeX, VideoOff, FileQuestion, HelpCircle, Film } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  movieSlug: string;
  movieName: string;
  episodeName?: string;
  serverName?: string;
}

const ISSUE_OPTIONS = [
  {
    id: "video_error",
    label: "Video không phát được / Bị đứng hình xoay tròn",
    icon: VideoOff,
    desc: "Màn hình đen, báo lỗi mạng hoặc tải mãi không chạy",
  },
  {
    id: "audio_error",
    label: "Mất tiếng / Âm thanh bị rè, lệch tiếng",
    icon: VolumeX,
    desc: "Không có âm thanh hoặc tiếng đi trước/sau hình",
  },
  {
    id: "subtitle_error",
    label: "Lỗi phụ đề / Thuyết minh",
    icon: FileQuestion,
    desc: "Không có sub, sub dịch sai hoặc lệch thời gian",
  },
  {
    id: "wrong_episode",
    label: "Sai tập phim / Nhầm phim khác",
    icon: Film,
    desc: "Nội dung tập phim không trùng khớp với số tập",
  },
  {
    id: "other",
    label: "Vấn đề khác",
    icon: HelpCircle,
    desc: "Chất lượng mờ, quảng cáo che màn hình...",
  },
];

export default function ReportModal({
  isOpen,
  onClose,
  movieSlug,
  movieName,
  episodeName,
  serverName,
}: ReportModalProps) {
  const [selectedIssue, setSelectedIssue] = useState<string>("video_error");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIssue) {
      toast.error("Vui lòng chọn loại lỗi gặp phải.");
      return;
    }

    try {
      setIsSubmitting(true);
      const chosenOption = ISSUE_OPTIONS.find((opt) => opt.id === selectedIssue);
      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          movieSlug,
          movieName,
          episodeName,
          serverName,
          issueType: chosenOption?.label || selectedIssue,
          description,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Cảm ơn bạn! Đội ngũ kỹ thuật đã tiếp nhận báo cáo và sẽ kiểm tra sớm nhất.");
        onClose();
        setDescription("");
      } else {
        toast.error(data.error || "Gửi báo cáo thất bại.");
      }
    } catch {
      toast.error("Có lỗi xảy ra khi kết nối máy chủ.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[460px] max-h-[92vh] overflow-y-auto custom-scrollbar bg-[#0d120f] border border-brand-green/30 rounded-2xl p-4 sm:p-5 shadow-[0_10px_50px_rgba(0,0,0,0.8)] text-white"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-3 pb-2.5 border-b border-white/10">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-white leading-tight">Báo lỗi tập phim</h3>
              <p className="text-[11px] text-white/60 truncate">
                {movieName} {episodeName ? `• ${episodeName}` : ""}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
            aria-label="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-white/70 uppercase tracking-wider">
              Chọn sự cố bạn đang gặp:
            </label>
            <div className="space-y-1.5">
              {ISSUE_OPTIONS.map((option) => {
                const Icon = option.icon;
                const isSelected = selectedIssue === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setSelectedIssue(option.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? "bg-brand-green/10 border-brand-green/60 text-white shadow-[0_0_12px_rgba(32,214,107,0.12)]"
                        : "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/15 text-white/75"
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isSelected ? "text-brand-green" : "text-white/50"}`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-[13px] font-medium leading-tight">{option.label}</p>
                      <p className="text-[10.5px] text-white/45 truncate mt-0.5">{option.desc}</p>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-brand-green shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5 pt-2.5">
            <label className="text-[11px] font-medium text-white/70 block">
              Ghi chú thêm (tùy chọn):
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ví dụ: Bị đứng từ phút 15:20, đã tải lại nhưng không xem được..."
              rows={2}
              maxLength={500}
              className="w-full text-xs bg-black/50 border border-white/15 rounded-xl px-3 py-2 text-white placeholder:text-white/30 focus:outline-none focus:border-brand-green transition-colors resize-none h-16"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={isSubmitting}
              className="h-8 text-xs text-white/70 hover:text-white hover:bg-white/10 rounded-lg px-3"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-8 bg-brand-green hover:bg-brand-green-hover text-black font-bold text-xs rounded-lg px-3.5 flex items-center gap-1.5 cursor-pointer shadow-[0_0_15px_rgba(32,214,107,0.25)] active:scale-95 transition-all"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang gửi...</span>
                </>
              ) : (
                <span>Gửi báo cáo</span>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
