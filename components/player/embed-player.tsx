"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

interface EmbedPlayerProps {
    videoUrl: string;
    onEnded?: () => void;
}

const EmbedPlayer = ({
    videoUrl,
    onEnded,
}: EmbedPlayerProps) => {
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    const handleBack = () => {
        if (typeof window !== "undefined" && window.history.length > 1) {
            router.back();
        } else {
            router.push("/");
        }
    };

    return (
        <div className="relative bg-black w-full h-full group">
            {/* Lớp Overlay Gradient để bảo vệ nút Back luôn rõ ràng */}
            <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-black/80 to-transparent z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            {/* Back Button */}
            <button
                onClick={handleBack}
                className="absolute top-4 left-4 z-20 flex items-center justify-center w-10 h-10 bg-black/40 hover:bg-black/80 backdrop-blur-sm text-white rounded-full transition-all duration-300 opacity-0 group-hover:opacity-100"
                title="Quay lại"
            >
                <ArrowLeft className="w-5 h-5" strokeWidth={2.5} />
            </button>

            <iframe
                src={videoUrl}
                className="w-full h-full absolute inset-0 rounded-lg border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                sandbox="allow-scripts allow-same-origin allow-presentation allow-forms"
                allowFullScreen
                title="Video Player"
                onLoad={() => setIsLoading(false)}
            />

            {/* Tối ưu Loading Indicator với hiệu ứng Fade-out */}
            <div 
                className={`absolute inset-0 flex items-center justify-center bg-black/80 z-30 transition-opacity duration-500 pointer-events-none ${
                    isLoading ? "opacity-100" : "opacity-0"
                }`}
            >
                <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 border-4 border-white/20 border-t-blue-500 rounded-full animate-spin shadow-[0_0_15px_rgba(59,130,246,0.5)]"></div>
                    <p className="text-white text-sm font-medium tracking-wide animate-pulse">Đang kết nối máy chủ...</p>
                </div>
            </div>
        </div>
    );
};

export default EmbedPlayer;

