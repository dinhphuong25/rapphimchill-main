"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

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
    const router = useRouter();

    useEffect(() => {
        setIsLoading(true);
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 4000);
        return () => clearTimeout(timer);
    }, [videoUrl]);

    const handleBack = () => {
        if (typeof window !== "undefined" && window.history.length > 1) {
            router.back();
        } else {
            router.push("/");
        }
    };

    return (
        <div className="relative bg-black w-full h-full group select-none">
            {/* Top gradient overlay for hover controls */}
            <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-black/80 to-transparent z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            {/* Back Button */}
            <button
                onClick={handleBack}
                className="absolute top-4 left-4 z-20 flex items-center justify-center w-10 h-10 bg-black/50 hover:bg-black/80 backdrop-blur-sm text-white rounded-full transition-all duration-300 opacity-0 group-hover:opacity-100 cursor-pointer border border-white/10 active:scale-95"
                title="Quay lại"
            >
                <ArrowLeft className="w-5 h-5" strokeWidth={2.5} />
            </button>

            <iframe
                src={videoUrl}
                className="w-full h-full absolute inset-0 rounded-lg border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
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
                    <div className="w-12 h-12 border-4 border-brand-green/20 border-t-brand-green rounded-full animate-spin"></div>
                    <p className="text-white text-sm font-semibold tracking-wide animate-pulse">
                        Đang kết nối Máy chủ Dự phòng...
                    </p>
                </div>
            </div>
        </div>
    );
};

export default EmbedPlayer;

