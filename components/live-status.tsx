"use client";

import { useState, useEffect } from "react";
import { RefreshCw } from "lucide-react";

interface LiveStatusProps {
    lastUpdated: Date | null;
    isRefreshing: boolean;
    onRefresh?: () => void;
}

export default function LiveStatus({ lastUpdated, isRefreshing, onRefresh }: LiveStatusProps) {
    const [timeAgo, setTimeAgo] = useState<string>("");

    useEffect(() => {
        if (!lastUpdated) return;

        const updateTimeAgo = () => {
            const now = new Date();
            const diff = now.getTime() - lastUpdated.getTime();
            const seconds = Math.floor(diff / 1000);
            const minutes = Math.floor(seconds / 60);

            if (minutes < 1) {
                setTimeAgo("vừa xong");
            } else if (minutes === 1) {
                setTimeAgo("1 phút trước");
            } else if (minutes < 60) {
                setTimeAgo(`${minutes} phút trước`);
            } else {
                const hours = Math.floor(minutes / 60);
                setTimeAgo(`${hours} giờ trước`);
            }
        };

        updateTimeAgo();
        const interval = setInterval(updateTimeAgo, 10000); // Update every 10 seconds

        return () => clearInterval(interval);
    }, [lastUpdated]);

    return (
        <div className="flex items-center gap-2 text-xs text-gray-400">
            <div className={`w-2 h-2 rounded-full ${isRefreshing ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`} />
            <span>
                {isRefreshing ? "Đang cập nhật..." : `Cập nhật ${timeAgo}`}
            </span>
            {onRefresh && (
                <button
                    onClick={onRefresh}
                    disabled={isRefreshing}
                    className="p-1 rounded-full hover:bg-white/10 transition-colors disabled:opacity-50"
                    title="Làm mới dữ liệu"
                >
                    <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                </button>
            )}
        </div>
    );
}

// Floating notification for new updates
interface NewUpdatesNotificationProps {
    hasNewContent: boolean;
    onRefresh: () => void;
}

export function NewUpdatesNotification({ hasNewContent, onRefresh }: NewUpdatesNotificationProps) {
    if (!hasNewContent) return null;

    return (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 animate-bounce">
            <button
                onClick={onRefresh}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-full shadow-lg shadow-primary/30 hover:bg-primary/90 transition-all"
            >
                <RefreshCw className="w-4 h-4" />
                <span className="text-sm font-medium">Có nội dung mới!</span>
            </button>
        </div>
    );
}

// Auto-refresh countdown indicator
interface RefreshCountdownProps {
    secondsUntilRefresh: number;
}

export function RefreshCountdown({ secondsUntilRefresh }: RefreshCountdownProps) {
    const minutes = Math.floor(secondsUntilRefresh / 60);
    const seconds = secondsUntilRefresh % 60;

    return (
        <div className="text-xs text-gray-500">
            Tự động cập nhật sau: {minutes > 0 ? `${minutes}:` : ""}{seconds.toString().padStart(2, '0')}
        </div>
    );
}
