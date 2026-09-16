"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Server, ShieldCheck, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface EmbedPlayerProps {
    videoUrl: string;
    onEnded?: () => void;
    onSwitchToM3u8?: () => void;
}

const EmbedPlayer = ({
    videoUrl,
    onEnded,
    onSwitchToM3u8,
}: EmbedPlayerProps) => {
    const [isLoading, setIsLoading] = useState(true);
    const [adShield, setAdShield] = useState<boolean>(true);
    const [showBadge, setShowBadge] = useState<boolean>(false);
    const router = useRouter();

    useEffect(() => {
        setIsLoading(true);
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 4000);
        return () => clearTimeout(timer);
    }, [videoUrl]);

    // Load saved ad shield preference on mount, default to true ('always')
    useEffect(() => {
        try {
            const saved = localStorage.getItem('cinema_ad_shield');
            if (saved === 'off') {
                setAdShield(false);
            } else {
                setAdShield(true);
                if (!saved) {
                    localStorage.setItem('cinema_ad_shield', 'always');
                }
            }
        } catch (e) {}
    }, []);

    // Show shield notification badge on video change or shield activation
    useEffect(() => {
        if (adShield) {
            setShowBadge(true);
            const timer = setTimeout(() => setShowBadge(false), 4000);
            return () => clearTimeout(timer);
        } else {
            setShowBadge(false);
        }
    }, [videoUrl, adShield]);

    const toggleAdShield = () => {
        const next = !adShield;
        setAdShield(next);
        try {
            localStorage.setItem('cinema_ad_shield', next ? 'always' : 'off');
        } catch (e) {}
        if (next) {
            toast.success("Đã bật che quảng cáo cờ bạc");
        } else {
            toast.info("Đã tắt che quảng cáo cờ bạc");
        }
    };

    const handleBack = () => {
        if (typeof window !== "undefined" && window.history.length > 1) {
            router.back();
        } else {
            router.push("/");
        }
    };

    return (
        <div className="relative bg-black w-full h-full group select-none">
            {/* Intelligent Anti-Ad Banner Shield (Tự động che dải quảng cáo bài bạc ở mép trên) */}
            <div
                className={cn(
                    "absolute top-0 left-0 right-0 z-20 pointer-events-none overflow-hidden transition-all duration-300",
                    adShield ? "opacity-100 h-10 sm:h-12 md:h-14 lg:h-16" : "opacity-0 h-0"
                )}
            >
                <div className="w-full h-full bg-gradient-to-b from-black/95 via-black/85 via-65% to-transparent" />
            </div>

            {/* Subtle status badge */}
            {adShield && (
                <div
                    className={cn(
                        "absolute top-16 right-4 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/85 backdrop-blur-md border border-brand-green/40 text-[11px] font-semibold text-brand-green shadow-xl transition-opacity duration-300 pointer-events-auto",
                        showBadge ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                    )}
                >
                    <ShieldCheck className="w-3.5 h-3.5 text-brand-green animate-pulse" />
                    <span>Đã tự động che QC cờ bạc</span>
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            toggleAdShield();
                        }}
                        className="ml-1 text-white/50 hover:text-white cursor-pointer p-0.5"
                        title="Tắt che quảng cáo"
                    >
                        <X className="w-3 h-3" />
                    </button>
                </div>
            )}

            {/* Top gradient overlay for hover controls */}
            <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-black/80 to-transparent z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            {/* Back Button */}
            <button
                onClick={handleBack}
                className="absolute top-4 left-4 z-20 flex items-center justify-center w-10 h-10 bg-black/50 hover:bg-black/80 backdrop-blur-sm text-white rounded-full transition-all duration-300 opacity-0 group-hover:opacity-100 cursor-pointer border border-white/10 shadow-lg active:scale-95"
                title="Quay lại"
            >
                <ArrowLeft className="w-5 h-5" strokeWidth={2.5} />
            </button>

            {/* Action buttons top-right */}
            <div className="absolute top-4 right-4 z-20 flex items-center gap-2 opacity-80 hover:opacity-100 transition-opacity duration-300">
                {/* 1-Click Anti-Ad Shield Toggle */}
                <button
                    onClick={toggleAdShield}
                    className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 bg-black/60 hover:bg-black/90 backdrop-blur-md border rounded-full transition-all duration-300 cursor-pointer text-xs font-bold shadow-lg active:scale-95",
                        adShield
                            ? "text-brand-green border-brand-green/40 shadow-[0_0_10px_rgba(34,197,94,0.2)]"
                            : "text-white/50 border-white/15 hover:text-white"
                    )}
                    title={adShield ? "Đang bật che QC cờ bạc (Bấm để tắt)" : "Đang tắt che QC (Bấm để bật)"}
                >
                    <ShieldCheck className={cn("w-3.5 h-3.5", adShield && "drop-shadow-[0_0_6px_rgba(34,197,94,0.5)]")} />
                    <span className="hidden sm:inline">{adShield ? "Đang che QC" : "Bật che QC"}</span>
                </button>

                {/* Switch back to Default Server Button */}
                {onSwitchToM3u8 && (
                    <button
                        onClick={onSwitchToM3u8}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-black/60 hover:bg-black/90 backdrop-blur-md text-brand-green hover:text-white border border-brand-green/30 hover:border-brand-green/60 rounded-full transition-all duration-300 cursor-pointer text-xs font-bold shadow-lg active:scale-95"
                        title="Chuyển về Máy chủ Mặc định"
                    >
                        <Server className="w-3.5 h-3.5" />
                        <span>Máy chủ Mặc định</span>
                    </button>
                )}
            </div>

            <iframe
                src={videoUrl}
                className="w-full h-full absolute inset-0 rounded-lg border-0"
                allow="accelerometer; autoplay *; clipboard-write; encrypted-media *; gyroscope; picture-in-picture *; fullscreen *"
                sandbox="allow-scripts allow-same-origin allow-presentation allow-forms allow-top-navigation-by-user-activation"
                allowFullScreen
                title="Video Player"
                onLoad={() => setIsLoading(false)}
            />

            {/* Loading Indicator */}
            <div 
                className={`absolute inset-0 flex items-center justify-center bg-black/90 z-30 transition-opacity duration-500 pointer-events-none ${
                    isLoading ? "opacity-100" : "opacity-0"
                }`}
            >
                <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 border-4 border-brand-green/20 border-t-brand-green rounded-full animate-spin shadow-[0_0_15px_rgba(34,197,94,0.4)]"></div>
                    <p className="text-white text-sm font-semibold tracking-wide animate-pulse">
                        Đang kết nối Máy chủ Dự phòng...
                    </p>
                </div>
            </div>
        </div>
    );
};

export default EmbedPlayer;

